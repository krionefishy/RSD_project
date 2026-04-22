"""Seed users for local development.

Creates one user per UserRole with a deterministic email and a common password.
Safe to re-run: upserts by email.

Usage:
    python -m backend.scripts.seed_users
"""
import asyncio
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.auth.password import PasswordService
from app.users.db_models import UserModel, UserRole

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("seed_users")

DEFAULT_PASSWORD = "Password123!"

SEED_USERS = [
    (UserRole.SUPER_ADMIN, "superadmin@rsd.local", "Super", "Admin"),
    (UserRole.ROOT_ADMIN, "rootadmin@rsd.local", "Root", "Admin"),
    (UserRole.ADMIN_STAFF, "staff@rsd.local", "Staff", "Admin"),
    (UserRole.ADMIN_EDUCATION, "education@rsd.local", "Education", "Admin"),
    (UserRole.ADMIN_SALES, "sales@rsd.local", "Sales", "Admin"),
    (UserRole.MANAGER, "manager@rsd.local", "Manager", "User"),
    (UserRole.SELLER, "seller@rsd.local", "Seller", "User"),
]


async def seed(session: AsyncSession) -> None:
    hashed = PasswordService.hash(DEFAULT_PASSWORD)

    for role, email, first, last in SEED_USERS:
        existing = await session.execute(select(UserModel).where(UserModel.email == email))
        user = existing.scalar_one_or_none()
        if user:
            user.role = role
            user.hashed_password = hashed
            user.first_name = first
            user.last_name = last
            logger.info("Updated seed user %s (%s)", email, role.value)
        else:
            session.add(
                UserModel(
                    email=email,
                    hashed_password=hashed,
                    role=role,
                    first_name=first,
                    last_name=last,
                )
            )
            logger.info("Created seed user %s (%s)", email, role.value)

    await session.commit()


async def main() -> None:
    db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://app:appsecret@localhost:5432/rsd_db")
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url)
    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        await seed(session)

    await engine.dispose()
    logger.info("Default password for all seed users: %s", DEFAULT_PASSWORD)


if __name__ == "__main__":
    asyncio.run(main())
