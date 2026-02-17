import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from shared.base import Base


class Database:
    """Единое подключение к PostgreSQL. Все микросервисы подключаются к одной БД."""

    def __init__(self):
        self.engine = None
        self.session_factory = None
        self.Base = Base
        self.metadata = self.Base.metadata
        self.logger = logging.getLogger("Database")

    async def connect(self, db_url: str):
        self.engine = create_async_engine(url=db_url, echo=False)
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        self.logger.info("Database connected")

    async def disconnect(self):
        if self.engine:
            await self.engine.dispose()
            self.logger.info("Database disconnected")

    def session(self):
        if not self.session_factory:
            raise RuntimeError("Database is not connected")
        return self.session_factory()
