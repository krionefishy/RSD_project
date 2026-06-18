import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.super_admin.usecases.assign_root_admin_usecase import AssignRootAdminUseCase
from app.admin.super_admin.usecases.remove_root_admin_usecase import RemoveRootAdminUseCase
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder
from uuid import uuid4


class TestAssignRootAdminUseCase:
    async def test_super_admin_can_assign_root_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_assign",
            role=UserRole.SUPER_ADMIN,
        )
        seller = await builder.build_user(
            external_system_id="seller_get_root",
            role=UserRole.SELLER,
        )
        ctx = builder.auth_context_for(super_admin)

        result = await AssignRootAdminUseCase(db_session).execute(seller.id, ctx)

        assert result.role == UserRole.ROOT_ADMIN
        assert result.id == seller.id

    async def test_root_admin_cannot_assign_root_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        root_admin = await builder.build_user(
            external_system_id="root_try_assign",
            role=UserRole.ROOT_ADMIN,
        )
        seller = await builder.build_user(
            external_system_id="seller_target",
            role=UserRole.SELLER,
        )
        ctx = builder.auth_context_for(root_admin)

        with pytest.raises(ProfileForbiddenError):
            await AssignRootAdminUseCase(db_session).execute(seller.id, ctx)

    async def test_raises_conflict_when_assigning_own_account(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_self_assign",
            role=UserRole.SUPER_ADMIN,
        )
        ctx = builder.auth_context_for(super_admin)

        with pytest.raises(ProfileConflictError):
            await AssignRootAdminUseCase(db_session).execute(super_admin.id, ctx)

    async def test_raises_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_assign_nf",
            role=UserRole.SUPER_ADMIN,
        )
        ctx = builder.auth_context_for(super_admin)

        with pytest.raises(ProfileNotFoundError):
            await AssignRootAdminUseCase(db_session).execute(uuid4(), ctx)


class TestRemoveRootAdminUseCase:
    async def test_super_admin_can_remove_root_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_remove",
            role=UserRole.SUPER_ADMIN,
        )
        root_admin = await builder.build_user(
            external_system_id="root_to_demote",
            role=UserRole.ROOT_ADMIN,
        )
        ctx = builder.auth_context_for(super_admin)

        result = await RemoveRootAdminUseCase(db_session).execute(root_admin.id, ctx)

        assert result.role == UserRole.SELLER

    async def test_raises_forbidden_when_target_is_not_root_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_remove_seller",
            role=UserRole.SUPER_ADMIN,
        )
        seller = await builder.build_user(
            external_system_id="seller_not_root",
            role=UserRole.SELLER,
        )
        ctx = builder.auth_context_for(super_admin)

        with pytest.raises(ProfileForbiddenError):
            await RemoveRootAdminUseCase(db_session).execute(seller.id, ctx)

    async def test_raises_conflict_when_removing_own_role(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_remove_self",
            role=UserRole.SUPER_ADMIN,
        )
        ctx = builder.auth_context_for(super_admin)

        with pytest.raises(ProfileConflictError):
            await RemoveRootAdminUseCase(db_session).execute(super_admin.id, ctx)
