from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.profiles.block_employee_profile_usecase import (
    BlockEmployeeProfileUseCase,
)
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError
from tests.builder import Builder
from tests.mocks import MockRefreshTokenStore


class TestBlockEmployeeProfileUseCase:
    async def test_blocks_employee_and_invalidates_tokens(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="block_profile_user")
        refresh_store = MockRefreshTokenStore()
        ctx = builder.auth_context_for(admin)

        result = await BlockEmployeeProfileUseCase(db_session, refresh_store).execute(
            seller.id,
            ctx,
        )

        assert result.is_active is False
        assert seller.id in refresh_store._deleted_users

    async def test_is_idempotent_when_user_already_blocked(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(
            external_system_id="already_blocked_user",
            is_active=False,
        )
        refresh_store = MockRefreshTokenStore()
        ctx = builder.auth_context_for(admin)

        result = await BlockEmployeeProfileUseCase(db_session, refresh_store).execute(
            seller.id,
            ctx,
        )

        assert result.is_active is False

    async def test_raises_conflict_when_blocking_self(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        refresh_store = MockRefreshTokenStore()
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileConflictError):
            await BlockEmployeeProfileUseCase(db_session, refresh_store).execute(
                admin.id,
                ctx,
            )

    async def test_raises_forbidden_when_blocking_super_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        super_admin = await builder.build_user(
            external_system_id="super_admin_block",
            role=UserRole.SUPER_ADMIN,
        )
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await BlockEmployeeProfileUseCase(db_session, MockRefreshTokenStore()).execute(
                super_admin.id,
                ctx,
            )

        assert exc_info.value.status_code == 403

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="block_target_seller")
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await BlockEmployeeProfileUseCase(db_session, MockRefreshTokenStore()).execute(
                target.id,
                ctx,
            )
