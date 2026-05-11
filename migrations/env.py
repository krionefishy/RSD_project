import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from backend.storage.pg.database import Base

import backend.app.knowledge_base.db_models  # noqa: F401 - register tables with Base.metadata
import backend.app.locations.db_models  # noqa: F401 - register tables with Base.metadata
import backend.app.users.db_models  # noqa: F401 - register tables with Base.metadata

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

config = context.config
fileConfig(config.config_file_name)
target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    if not url:
        raise RuntimeError("DATABASE_URL is not set in alembic.ini or environment")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    """Run migrations in 'online' mode with async engine."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set in environment")
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    connectable = create_async_engine(
        database_url,
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:

        def run_migrations(conn):
            context.configure(
                connection=conn,
                target_metadata=target_metadata,
                compare_type=True,
            )
            with context.begin_transaction():
                context.run_migrations()

        await connection.run_sync(run_migrations)


def run_migrations_online():
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
