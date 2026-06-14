from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from storage.pg.database import Database


class MainReplicaDatabase(Database):
    """Read-only connection to the main application database replica."""

    @asynccontextmanager
    async def read_only_transaction(self) -> AsyncIterator[AsyncSession]:
        async with self.session() as session, session.begin():
            await session.execute(text("SET TRANSACTION READ ONLY"))
            yield session
