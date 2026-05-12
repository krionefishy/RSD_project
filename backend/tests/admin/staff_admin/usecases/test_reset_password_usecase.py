from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.reset_password_usecase import ResetPasswordUseCase
from app.users.db_models import UserRole
from tests.builder import Builder
from tests.mocks import MockPasswordService, MockRefreshTokenStore


class TestResetPasswordUseCase:
    async def test_resets_password_and_returns_temp_password(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="reset_test_user",
            first_name="John",
            role=UserRole.SELLER,
            is_temp_password=False,
        )
        password_service = MockPasswordService()
        refresh_store = MockRefreshTokenStore()
        usecase = ResetPasswordUseCase(db_session, password_service, refresh_store)

        result = await usecase.execute(user.id)

        assert result is not None
        assert len(result) == 12
        assert user.is_temp_password is True
        assert len(refresh_store._deleted_users) == 1
        assert refresh_store._deleted_users[0] == user.id

    async def test_returns_none_for_nonexistent_user(
        self,
        db_session: AsyncSession,
    ) -> None:
        password_service = MockPasswordService()
        refresh_store = MockRefreshTokenStore()
        usecase = ResetPasswordUseCase(db_session, password_service, refresh_store)

        result = await usecase.execute(uuid4())

        assert result is None
