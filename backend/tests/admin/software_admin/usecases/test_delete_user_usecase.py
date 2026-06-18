from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.profiles.delete_employee_profile_usecase import DeleteEmployeeProfileUseCase
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder


class TestDeleteUserUseCaseViaRootAdmin:
    """Tests for DeleteEmployeeProfileUseCase invoked with root_admin context (via software_admin route)."""

    async def test_root_admin_can_delete_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_del",
            role=UserRole.ROOT_ADMIN,
        )
        seller = await builder.build_user(
            external_system_id="seller_to_delete",
            role=UserRole.SELLER,
        )
        ctx = builder.auth_context_for(root_admin)

        result = await DeleteEmployeeProfileUseCase(db_session).execute(seller.id, ctx)

        assert result.deleted is True

    async def test_root_admin_can_delete_admin_staff(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_del_admin",
            role=UserRole.ROOT_ADMIN,
        )
        admin_staff = await builder.build_user(
            external_system_id="admin_staff_to_delete",
            role=UserRole.ADMIN_STAFF,
        )
        ctx = builder.auth_context_for(root_admin)

        result = await DeleteEmployeeProfileUseCase(db_session).execute(admin_staff.id, ctx)

        assert result.deleted is True

    async def test_root_admin_cannot_delete_super_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_del_super",
            role=UserRole.ROOT_ADMIN,
        )
        super_admin = await builder.build_user(
            external_system_id="super_admin_protected",
            role=UserRole.SUPER_ADMIN,
        )
        ctx = builder.auth_context_for(root_admin)

        with pytest.raises(ProfileForbiddenError):
            await DeleteEmployeeProfileUseCase(db_session).execute(super_admin.id, ctx)

    async def test_admin_staff_cannot_delete_admin_staff(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin1 = await builder.build_user(
            external_system_id="admin_staff_del_1",
            role=UserRole.ADMIN_STAFF,
        )
        admin2 = await builder.build_user(
            external_system_id="admin_staff_del_2",
            role=UserRole.ADMIN_STAFF,
        )
        ctx = builder.auth_context_for(admin1)

        with pytest.raises(ProfileForbiddenError):
            await DeleteEmployeeProfileUseCase(db_session).execute(admin2.id, ctx)

    async def test_raises_conflict_when_deleting_self(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_self_del",
            role=UserRole.ROOT_ADMIN,
        )
        ctx = builder.auth_context_for(root_admin)

        with pytest.raises(ProfileConflictError):
            await DeleteEmployeeProfileUseCase(db_session).execute(root_admin.id, ctx)

    async def test_raises_not_found_for_missing_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_del_nf",
            role=UserRole.ROOT_ADMIN,
        )
        ctx = builder.auth_context_for(root_admin)

        with pytest.raises(ProfileNotFoundError):
            await DeleteEmployeeProfileUseCase(db_session).execute(uuid4(), ctx)
