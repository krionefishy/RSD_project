import logging
import os
import re
from collections.abc import AsyncGenerator, AsyncIterator
from contextvars import ContextVar
from datetime import datetime
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlparse, urlunparse

import pytest
from dishka import Provider, Scope, from_context, make_async_container, provide
from dishka.integrations.fastapi import FastapiProvider, setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from httpx import ASGITransport, AsyncClient
from shared.di.providers.admin import AdminUsecaseProvider
from shared.di.providers.auth import AuthContextProvider, AuthUsecaseProvider
from shared.di.providers.educ_admin import EducAdminUsecaseProvider
from shared.di.providers.knowledge_base import KnowledgeBaseUsecaseProvider
from shared.di.providers.locations import LocationsUsecaseProvider
from shared.di.providers.personnel import PersonnelUsecaseProvider
from shared.di.providers.profile import ProfileUsecaseProvider
from shared.di.providers.sellings import SellingsUsecaseProvider
from shared.di.providers.users import UsersUsecaseProvider
from shared.integrations.report_service import ReportServiceClient
from shared.kafka_streams.producer import KafkaProducerWrapper
from shared.settings.config import Settings, load_settings
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from storage.pg.database import Base, Database
from storage.redis.client import RedisClient
from storage.s3.client import S3Client

import app.knowledge_base.db_models  # noqa: F401
from app.api.router import api_router
from app.application import Application
from app.auth.password import PasswordService
from app.auth.redis_store import RefreshTokenStore
from app.auth.tokens import create_access_token
from app.locations.db_models import BlockModel, LocationModel
from app.users.db_models import UserModel, UserRole
from tests.builder import Builder
from tests.mocks import FakeKafkaBroker, MockPasswordService, MockRefreshTokenStore, MockS3Client
from tests.mocks.report_service import FakeReportServiceClient

_test_password_service = MockPasswordService()
_test_refresh_store = MockRefreshTokenStore()
_current_db_session: ContextVar[AsyncSession | None] = ContextVar(
    "current_test_db_session",
    default=None,
)


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
        level=logging.WARNING,
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
            if Path(p).exists():
                config_path = p
                break
        config_path = config_path or "backend/shared/settings/config.test.yaml"

    cfg = load_settings(config_path)

    if os.environ.get("DATABASE_URL"):
        url = os.environ["DATABASE_URL"]
        parsed = urlparse(url)
        cfg = Settings(
            database=cfg.database.__class__(
                host=parsed.hostname or "localhost",
                port=parsed.port or 5432,
                user=parsed.username or "postgres",
                password=parsed.password or "",
                database=parsed.path.lstrip("/") if parsed.path else "postgres",
                echo=cfg.database.echo,
                url_override=url,
            ),
            jwt=cfg.jwt,
            service_jwt=cfg.service_jwt,
            kafka=cfg.kafka,
            redis=cfg.redis,
            s3=cfg.s3,
            report_service_client=cfg.report_service_client,
            main_replica_database=cfg.main_replica_database,
            log_level=cfg.log_level,
            env_mode=cfg.env_mode,
        )
    return cfg


@pytest.fixture(scope="session")
async def db_engine(settings: Settings):
    engine = create_async_engine(
        url=settings.database.url,
        echo=False,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=False,
    )
    yield engine
    await engine.dispose()


@pytest.fixture(scope="session")
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
    return db


@pytest.fixture(scope="session")
async def application(
    database: Database,
    settings: Settings,
) -> Application:
    app = Application.__new__(Application)
    app.app = None
    app.db = database
    app.settings = settings
    app.redis_client = None
    app.s3_client = None

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

    mock_s3_inner = MockS3Client()
    mock_s3_client = S3Client(
        endpoint_url="http://localhost:9000",
        key_id="test-key",
        secret_key="test-secret",
        bucket_name="test-bucket",
        region="us-east-1",
        verify=False,
    )
    mock_s3_client._client = type(
        "Boto3PutObjectStub",
        (),
        {"put_object": mock_s3_inner.put_object_boto},
    )()

    # Build providers list manually without AppProvider to avoid S3Client from_context conflict
    class TestAppProvider(Provider):
        scope = Scope.APP

        settings = from_context(Settings)
        db = from_context(Database)
        redis = from_context(RedisClient)
        kafka_producer = from_context(KafkaProducerWrapper)

        @provide(scope=Scope.REQUEST)
        def get_s3(self) -> S3Client:
            return mock_s3_client

    from app.auth.rsa_keys import RsaKeyProvider

    class TestAuthProvider(Provider):
        scope = Scope.APP

        rsa_keys = provide(RsaKeyProvider, scope=Scope.APP)

        @provide
        def password_service(self) -> PasswordService:
            return _test_password_service

        @provide
        def refresh_store(self) -> RefreshTokenStore:
            return _test_refresh_store

    class TestSessionProvider(Provider):
        scope = Scope.REQUEST

        @provide
        async def session(self) -> AsyncIterator[AsyncSession]:
            session = _current_db_session.get()
            if session is None:
                raise RuntimeError("Test database session is not set")
            yield session

    class TestReportServiceProvider(Provider):
        scope = Scope.APP

        @provide
        def report_service_client(self) -> ReportServiceClient:
            return FakeReportServiceClient()

    test_providers = [
        TestAppProvider(),
        TestSessionProvider(),
        FastapiProvider(),
        TestAuthProvider(),
        AuthContextProvider(),
        AuthUsecaseProvider(),
        KnowledgeBaseUsecaseProvider(),
        EducAdminUsecaseProvider(),
        LocationsUsecaseProvider(),
        UsersUsecaseProvider(),
        ProfileUsecaseProvider(),
        PersonnelUsecaseProvider(),
        SellingsUsecaseProvider(),
        AdminUsecaseProvider(),
        TestReportServiceProvider(),
    ]

    container = make_async_container(
        *test_providers,
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
async def db_session(database: Database) -> AsyncGenerator[AsyncSession]:
    async with database.engine.connect() as connection:
        transaction = await connection.begin()
        session = AsyncSession(
            bind=connection,
            join_transaction_mode="create_savepoint",
            expire_on_commit=False,
        )
        token = _current_db_session.set(session)
        try:
            yield session
        finally:
            _current_db_session.reset(token)
            await session.close()
            await transaction.rollback()


@pytest.fixture
async def client(application: Application, db_session: AsyncSession):
    transport = ASGITransport(app=application.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def frozen_datetime() -> datetime:
    return datetime(2024, 10, 10, 22, 0, 0)


@pytest.fixture(autouse=True, scope="session")
def mock_kafka_broker():
    with patch("shared.kafka_streams.producer.KafkaProducerWrapper", FakeKafkaBroker):
        yield


@pytest.fixture(autouse=True, scope="session")
def mock_s3_client():
    with patch("storage.s3.client.S3Client", MockS3Client):
        yield



@pytest.fixture
def builder(db_session: AsyncSession, frozen_datetime: datetime) -> Builder:
    """Provide a Builder instance for creating test entities.

    Usage:
        async def test_something(builder: Builder):
            user = await builder.build_user(external_system_id="test_001")
            location = await builder.default_location
    """
    return Builder(db_session, frozen_datetime)


@pytest.fixture
async def default_user(builder: Builder) -> UserModel:
    return await builder.default_user


@pytest.fixture
async def default_location(builder: Builder) -> LocationModel:
    return await builder.default_location


@pytest.fixture
async def default_block(builder: Builder) -> BlockModel:
    return await builder.default_block


@pytest.fixture
def bearer_headers(settings: Settings):
    def _make(user: UserModel) -> dict[str, str]:
        role = user.role.value if isinstance(user.role, UserRole) else user.role
        token, _ = create_access_token(settings, user.id, role)
        return {"Authorization": f"Bearer {token}"}

    return _make


@pytest.fixture
def password_service() -> MockPasswordService:
    return _test_password_service
