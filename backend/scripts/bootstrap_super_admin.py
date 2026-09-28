"""Create or update the initial production super administrator."""

import asyncio
import os
from datetime import datetime
from uuid import uuid4

from shared.settings.config import load_settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.auth.password import PasswordService


async def main() -> None:
    login = os.environ.get("SUPER_ADMIN_LOGIN", "").strip()
    password = os.environ.get("SUPER_ADMIN_PASSWORD", "")
    if not login or len(password) < 8:
        raise RuntimeError(
            "SUPER_ADMIN_LOGIN and SUPER_ADMIN_PASSWORD (minimum 8 characters) are required"
        )

    settings = load_settings(os.environ.get("CONFIG_PATH"))
    if settings.env_mode != "production":
        raise RuntimeError("Super admin bootstrap is allowed only in production mode")

    engine = create_async_engine(settings.database.url)
    now = datetime.now()
    try:
        async with engine.begin() as connection:
            await connection.execute(
                text(
                    """
                    INSERT INTO users (
                        id, external_system_id, hashed_password, role,
                        first_name, last_name, is_active, created_at, updated_at
                    ) VALUES (
                        :id, :login, :password, 'super_admin',
                        'Системный', 'Администратор', true, :now, :now
                    )
                    ON CONFLICT (external_system_id) DO UPDATE SET
                        hashed_password = EXCLUDED.hashed_password,
                        role = 'super_admin',
                        is_active = true,
                        updated_at = EXCLUDED.updated_at
                    """
                ),
                {
                    "id": uuid4(),
                    "login": login,
                    "password": PasswordService.hash(password),
                    "now": now,
                },
            )
    finally:
        await engine.dispose()

    print(f"Super admin ready: {login}")


if __name__ == "__main__":
    asyncio.run(main())
