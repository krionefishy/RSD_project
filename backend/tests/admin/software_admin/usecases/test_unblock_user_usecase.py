from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.software_admin.usecases.unblock_user_usecase import UnblockUserUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestUnblockUserUseCase:
    async def test_unblocks_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="unblock_test_user",
            first_name="John",
            role=UserRole.SELLER,
            is_active=False,
        )
        usecase = UnblockUserUseCase(db_session)

        result = await usecase.execute(user.id)

        assert result is not None
        assert result.is_active is True
        assert result.id == user.id

    async def test_returns_none_for_nonexistent_user(
        self,
        db_session: AsyncSession,
    ) -> None:
        usecase = UnblockUserUseCase(db_session)

        result = await usecase.execute(uuid4())

        assert result is None
