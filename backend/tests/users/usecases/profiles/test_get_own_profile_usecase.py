from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from app.users.usecases.profiles.get_own_profile_usecase import GetOwnProfileUseCase
from tests.builder import Builder


class TestGetOwnProfileUseCase:
    async def test_returns_profile_for_active_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        result = await GetOwnProfileUseCase(db_session).execute(ctx)

        assert result.id == seller.id
        assert result.external_system_id == seller.external_system_id
        assert result.role == "seller"
        assert result.is_active is True

    async def test_raises_when_user_inactive(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="inactive_seller_profile",
            is_active=False,
        )
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await GetOwnProfileUseCase(db_session).execute(ctx)

    async def test_raises_when_user_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)
        ctx = type(ctx)(user_id="00000000-0000-0000-0000-000000000099", role=ctx.role)

        with pytest.raises(ProfileNotFoundError):
            await GetOwnProfileUseCase(db_session).execute(ctx)

    async def test_returns_profile_with_block_and_location(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        block = await builder.build_block(name="Profile Block")
        user, location, _ = await builder.build_user_with_location(
            user_kwargs={
                "external_system_id": "profile_with_block",
                "first_name": "Ivan",
                "last_name": "Petrov",
            },
            location_kwargs={"code": "PB01", "name": "Block Office"},
        )
        await builder.build_block_member(user=user, block=block)
        ctx = builder.auth_context_for(user)

        result = await GetOwnProfileUseCase(db_session).execute(ctx)

        assert result.location is not None
        assert result.location.name == "Block Office"
        assert result.block is not None
        assert result.block.name == "Profile Block"
        assert result.block_member_status == "primary"

    async def test_returns_external_system_id_when_name_empty(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="login_only_user",
            first_name=None,
            last_name=None,
        )
        ctx = builder.auth_context_for(user)

        result = await GetOwnProfileUseCase(db_session).execute(ctx)

        assert result.first_name is None
        assert result.last_name is None
