import logging
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Database:

    def __init__(self):
        self.engine = None
        self.session_factory = None
        self.Base = Base
        self.metadata = self.Base.metadata
        self.logger = logging.getLogger("Database")

    async def connect(self, db_url: str, echo: bool = False):
        self.engine = create_async_engine(
            url=db_url,
            echo=echo,
            future=True,
        )
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )

        async with self.session() as session:
            await session.execute(text("SELECT 1"))

        self.logger.info("Database connected successfully")

    async def disconnect(self):
        if self.engine:
            await self.engine.dispose()
            self.logger.info("Database disconnected")

    def session(self):
        if not self.session_factory:
            raise RuntimeError("Database is not connected. Call connect() first.")
        return self.session_factory()

    @asynccontextmanager
    async def transaction(self):
        """Context manager with auto commit/rollback."""
        session = self.session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
