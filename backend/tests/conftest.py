import logging
import os
import re
from typing import AsyncGenerator
from urllib.parse import urlparse, urlunparse

import pytest
from dishka import make_async_container
from dishka.integrations.fastapi import setup_dishka
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.router import api_router
from app.application import Application
from shared.di.providers import ALL_PROVIDERS
from shared.kafka_streams.producer import KafkaProducerWrapper
from shared.settings.config import Settings, load_settings
from storage.pg.database import Base, Database
from storage.redis.client import RedisClient

import app.knowledge_base.db_models  # noqa: F401


def _set_worker_database_url(config) -> None:
    if not hasattr(config, "workerinput") or not config.workerinput:
        return
    workerid = config.workerinput.get("workerid", "gw0")
    m = re.search(r"(\d+)$", workerid)
    worker_num = int(m.group(1)) if m else 0
    url = os.environ.get("DATABASE_URL")
    if not url:
        return
    parsed = urlparse(url)
    base = (parsed.path or "/").strip("/")
    if not base:
        return
    new_path = f"/{base}_{worker_num}"
    new_url = urlunparse(
        (parsed.scheme, parsed.netloc, new_path, parsed.params, parsed.query, parsed.fragment)
    )
    os.environ["DATABASE_URL"] = new_url


def pytest_configure(config):
    _set_worker_database_url(config)


@pytest.fixture(scope="session", autouse=True)
def configure_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


@pytest.fixture(scope="session")
def settings() -> Settings:
    config_path = os.getenv("CONFIG_PATH")
    if not config_path:
        search_paths = [
            "backend/shared/settings/config.test.yaml",
            "shared/settings/config.test.yaml",
            "config.test.yaml",
        ]
        for p in search_paths:
            if os.path.exists(p):
                config_path = p
                break
        config_path = config_path or "backend/shared/settings/config.test.yaml"

    cfg = load_settings(config_path)

    if os.environ.get("DATABASE_URL"):
        cfg = Settings(
            database=cfg.database.__class__(
                url=os.environ["DATABASE_URL"],
                echo=cfg.database.echo,
            ),
            kafka=cfg.kafka,
            redis=cfg.redis,
            s3=cfg.s3,
            log_level=cfg.log_level,
        )
    return cfg


@pytest.fixture(scope="module")
async def db_engine(settings: Settings):
    engine = create_async_engine(url=settings.database.url, echo=False)
    yield engine
    await engine.dispose()


@pytest.fixture(scope="module")
async def database(settings: Settings, db_engine) -> Database:
    db = Database()
    db.engine = db_engine
    db.session_factory = async_sessionmaker(
        bind=db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    db.Base = Base
    db.metadata = Base.metadata

    async with db.engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(text(f'DROP TABLE IF EXISTS "{table.name}" CASCADE'))
        await conn.run_sync(db.metadata.create_all)

    return db


@pytest.fixture
async def application(database: Database, settings: Settings) -> Application:
    app = Application.__new__(Application)
    app.app = None
    app.db = database
    app.settings = settings
    app.redis_client = None
    app.s3_client = None

    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    fastapi_app = FastAPI(title="RSD Backend Test")
    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    fastapi_app.include_router(api_router, prefix="/api/v1")
    app.app = fastapi_app

    kafka_producer = KafkaProducerWrapper(None)

    container = make_async_container(
        *ALL_PROVIDERS,
        context={
            Settings: settings,
            Database: database,
            RedisClient: RedisClient(host="localhost"),
            KafkaProducerWrapper: kafka_producer,
        },
    )
    setup_dishka(container, app.app)

    yield app

    await container.close()


@pytest.fixture
async def db_session(application: Application) -> AsyncGenerator[AsyncSession, None]:
    session = application.db.session()
    try:
        yield session
    finally:
        await session.close()


@pytest.fixture(autouse=True)
async def transactional_db(application: Application):
    engine = application.db.engine
    async with engine.connect() as conn:
        trans = await conn.begin()
        original_factory = application.db.session_factory

        def _session_factory(_conn=conn):
            return AsyncSession(
                bind=_conn,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",
            )

        application.db.session_factory = _session_factory
        try:
            yield
        finally:
            await trans.rollback()
            application.db.session_factory = original_factory


@pytest.fixture
async def client(application: Application):
    transport = ASGITransport(app=application.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
