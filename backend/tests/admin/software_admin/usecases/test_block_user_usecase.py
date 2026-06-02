from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.software_admin.usecases.block_user_usecase import BlockUserUseCase
from app.users.db_models import UserRole
from tests.builder import Builder
from tests.mocks import MockRefreshTokenStore


class TestBlockUserUseCase:
    async def test_blocks_user_and_deletes_tokens(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="block_test_user",
            first_name="John",
            role=UserRole.SELLER,
            is_active=True,
        )
        refresh_store = MockRefreshTokenStore()
        usecase = BlockUserUseCase(db_session, refresh_store)

        result = await usecase.execute(user.id)

        assert result is not None
        assert result.is_active is False
        assert result.id == user.id
        assert len(refresh_store._deleted_users) == 1
        assert refresh_store._deleted_users[0] == user.id

    async def test_returns_none_for_nonexistent_user(
        self,
        db_session: AsyncSession,
    ) -> None:
        refresh_store = MockRefreshTokenStore()
        usecase = BlockUserUseCase(db_session, refresh_store)

        result = await usecase.execute(uuid4())

        assert result is None

    async def test_raises_when_blocking_super_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_admin_user",
            first_name="Super",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        refresh_store = MockRefreshTokenStore()
        usecase = BlockUserUseCase(db_session, refresh_store)

        with pytest.raises(HTTPException) as exc_info:
            await usecase.execute(super_admin.id)

        assert exc_info.value.status_code == 403
