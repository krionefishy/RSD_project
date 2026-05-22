from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.profiles.unblock_employee_profile_usecase import (
    UnblockEmployeeProfileUseCase,
)
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileForbiddenError
from tests.builder import Builder


class TestUnblockEmployeeProfileUseCase:
    async def test_unblocks_employee(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(
            external_system_id="unblock_profile_user",
            is_active=False,
        )
        ctx = builder.auth_context_for(admin)

        result = await UnblockEmployeeProfileUseCase(db_session).execute(seller.id, ctx)

        assert result.is_active is True

    async def test_is_idempotent_when_user_already_active(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(
            external_system_id="already_active_user",
            is_active=True,
        )
        ctx = builder.auth_context_for(admin)

        result = await UnblockEmployeeProfileUseCase(db_session).execute(seller.id, ctx)

        assert result.is_active is True

    async def test_raises_forbidden_when_unblocking_super_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        super_admin = await builder.build_user(
            external_system_id="super_admin_unblock",
            role=UserRole.SUPER_ADMIN,
            is_active=False,
        )
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UnblockEmployeeProfileUseCase(db_session).execute(super_admin.id, ctx)

        assert exc_info.value.status_code == 403

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="unblock_target", is_active=False)
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await UnblockEmployeeProfileUseCase(db_session).execute(target.id, ctx)
