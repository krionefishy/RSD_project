from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.profiles.delete_employee_profile_usecase import (
    DeleteEmployeeProfileUseCase,
)
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder


class TestDeleteEmployeeProfileUseCase:
    async def test_soft_deletes_employee(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="delete_profile_user")
        ctx = builder.auth_context_for(admin)

        result = await DeleteEmployeeProfileUseCase(db_session).execute(seller.id, ctx)

        assert result.deleted is True
        await db_session.refresh(seller)
        assert seller.is_active is False

    async def test_raises_conflict_when_deleting_self(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileConflictError):
            await DeleteEmployeeProfileUseCase(db_session).execute(admin.id, ctx)

    async def test_raises_not_found_for_missing_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileNotFoundError):
            await DeleteEmployeeProfileUseCase(db_session).execute(uuid4(), ctx)

    async def test_raises_forbidden_when_deleting_super_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        super_admin = await builder.build_user(
            external_system_id="super_admin_delete",
            role=UserRole.SUPER_ADMIN,
        )
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await DeleteEmployeeProfileUseCase(db_session).execute(super_admin.id, ctx)

        assert exc_info.value.status_code == 403

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="delete_target")
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await DeleteEmployeeProfileUseCase(db_session).execute(target.id, ctx)
