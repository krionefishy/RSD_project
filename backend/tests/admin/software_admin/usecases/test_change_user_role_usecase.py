from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.software_admin.usecases.change_user_role_usecase import ChangeUserRoleUseCase
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder


class TestChangeUserRoleUseCase:
    async def test_root_admin_can_change_seller_to_manager(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_role_change",
            role=UserRole.ROOT_ADMIN,
        )
        seller = await builder.build_user(
            external_system_id="seller_to_change",
            role=UserRole.SELLER,
        )
        ctx = builder.auth_context_for(root_admin)

        result = await ChangeUserRoleUseCase(db_session).execute(seller.id, UserRole.MANAGER, ctx)

        assert result.role == UserRole.MANAGER
        assert result.id == seller.id

    async def test_root_admin_can_change_seller_to_admin_staff(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_role_change_2",
            role=UserRole.ROOT_ADMIN,
        )
        seller = await builder.build_user(
            external_system_id="seller_to_admin",
            role=UserRole.SELLER,
        )
        ctx = builder.auth_context_for(root_admin)

        result = await ChangeUserRoleUseCase(db_session).execute(seller.id, UserRole.ADMIN_STAFF, ctx)

        assert result.role == UserRole.ADMIN_STAFF

    async def test_root_admin_cannot_assign_super_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_cannot_super",
            role=UserRole.ROOT_ADMIN,
        )
        seller = await builder.build_user(
            external_system_id="seller_no_super",
            role=UserRole.SELLER,
        )
        ctx = builder.auth_context_for(root_admin)

        with pytest.raises(ProfileForbiddenError):
            await ChangeUserRoleUseCase(db_session).execute(seller.id, UserRole.SUPER_ADMIN, ctx)

    async def test_raises_conflict_when_changing_own_role(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_own_role",
            role=UserRole.ROOT_ADMIN,
        )
        ctx = builder.auth_context_for(root_admin)

        with pytest.raises(ProfileConflictError):
            await ChangeUserRoleUseCase(db_session).execute(root_admin.id, UserRole.SELLER, ctx)

    async def test_raises_not_found_for_nonexistent_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_nf",
            role=UserRole.ROOT_ADMIN,
        )
        ctx = builder.auth_context_for(root_admin)

        with pytest.raises(ProfileNotFoundError):
            await ChangeUserRoleUseCase(db_session).execute(uuid4(), UserRole.SELLER, ctx)

    async def test_root_admin_cannot_reassign_super_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_admin_vs_super",
            role=UserRole.ROOT_ADMIN,
        )
        super_admin = await builder.build_user(
            external_system_id="super_admin_target",
            role=UserRole.SUPER_ADMIN,
        )
        ctx = builder.auth_context_for(root_admin)

        with pytest.raises(ProfileForbiddenError):
            await ChangeUserRoleUseCase(db_session).execute(super_admin.id, UserRole.SELLER, ctx)

    async def test_super_admin_can_change_any_role(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_admin_changes",
            role=UserRole.SUPER_ADMIN,
        )
        root_admin = await builder.build_user(
            external_system_id="root_admin_target",
            role=UserRole.ROOT_ADMIN,
        )
        ctx = builder.auth_context_for(super_admin)

        result = await ChangeUserRoleUseCase(db_session).execute(root_admin.id, UserRole.SELLER, ctx)

        assert result.role == UserRole.SELLER
