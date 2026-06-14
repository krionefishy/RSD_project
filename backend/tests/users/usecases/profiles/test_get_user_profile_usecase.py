from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.db_models import UserRole
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from app.users.usecases.profiles.get_user_profile_usecase import GetUserProfileUseCase
from tests.builder import Builder


class TestGetUserProfileUseCase:
    async def test_seller_can_view_own_profile(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="seller_self_profile")
        ctx = builder.auth_context_for(seller)

        result = await GetUserProfileUseCase(db_session).execute(seller.id, ctx)

        assert result.id == seller.id

    async def test_seller_cannot_view_other_profile(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        other = await builder.build_user(external_system_id="other_seller_profile")
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await GetUserProfileUseCase(db_session).execute(other.id, ctx)

    async def test_manager_can_view_block_member_profile(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.default_manager
        block = await builder.default_block
        member = await builder.build_user(external_system_id="block_member_profile")
        await builder.build_block_member(user=member, block=block)
        ctx = builder.auth_context_for(manager)

        result = await GetUserProfileUseCase(db_session).execute(member.id, ctx)

        assert result.id == member.id

    async def test_admin_staff_can_view_any_profile(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="any_seller_profile")
        ctx = builder.auth_context_for(admin)

        result = await GetUserProfileUseCase(db_session).execute(seller.id, ctx)

        assert result.id == seller.id
        assert result.role == UserRole.SELLER.value

    async def test_raises_not_found_for_nonexistent_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileNotFoundError):
            await GetUserProfileUseCase(db_session).execute(uuid4(), ctx)

    async def test_manager_cannot_view_seller_outside_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.default_manager
        outsider = await builder.build_user(external_system_id="outside_block_seller")
        ctx = builder.auth_context_for(manager)

        with pytest.raises(ProfileForbiddenError):
            await GetUserProfileUseCase(db_session).execute(outsider.id, ctx)

    async def test_seller_cannot_view_profile(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await GetUserProfileUseCase(db_session).execute(uuid4(), ctx)
