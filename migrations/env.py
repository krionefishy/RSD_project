import asyncio
import os
import sys

sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "..")))

from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context

from backend.shared.base import Base

try:
    from backend.users_service.app.repository.models import User  # noqa: F401
except Exception:
    pass
try:
    from backend.checklists_service.app.repository.models import ChecklistPlaceholder  # noqa: F401
except Exception:
    pass
try:
    from backend.reports_service.app.repository.models import ReportPlaceholder  # noqa: F401
except Exception:
    pass
try:
    from backend.organizations_service.app.repository.models import OKKPlaceholder, CheckObjectPlaceholder  # noqa: F401
except Exception:
    pass

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url():
    """URL для миграций: из DATABASE_URL или из alembic.ini."""
    url = os.getenv("DATABASE_URL")
    if not url:
        url = config.get_main_option("sqlalchemy.url")
    if not url:
        raise RuntimeError("DATABASE_URL is not set in environment or alembic.ini")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def run_migrations_offline():
    """Run migrations in 'offline' mode (как в Barista)."""
    url = get_url()
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
    """Run migrations in 'online' mode with async engine (как в Barista)."""
    database_url = get_url()
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
