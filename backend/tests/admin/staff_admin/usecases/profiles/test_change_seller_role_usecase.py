from __future__ import annotations

import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.profiles.change_seller_role_usecase import ChangeSellerRoleUseCase
from app.personnel.domain import ChangeSellerRoleRequest
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError
from tests.builder import Builder


class TestChangeSellerRoleUseCase:
    async def test_updates_seller_role(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="change_seller_role_user")
        ctx = builder.auth_context_for(admin)

        result = await ChangeSellerRoleUseCase(db_session).execute(
            seller.id,
            ChangeSellerRoleRequest(seller_role="senior_seller"),
            ctx,
        )

        assert result.seller_role == "senior_seller"

    async def test_raises_conflict_for_non_seller_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        manager = await builder.build_user(
            external_system_id="manager_not_seller",
            role=UserRole.MANAGER,
        )
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileConflictError):
            await ChangeSellerRoleUseCase(db_session).execute(
                manager.id,
                ChangeSellerRoleRequest(seller_role="trainee"),
                ctx,
            )

    async def test_raises_validation_for_unknown_seller_role(
        self,
        builder: Builder,
    ) -> None:
        with pytest.raises(ValidationError):
            ChangeSellerRoleRequest(seller_role="unknown_role")

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await ChangeSellerRoleUseCase(db_session).execute(
                seller.id,
                ChangeSellerRoleRequest(seller_role="trainee"),
                ctx,
            )
