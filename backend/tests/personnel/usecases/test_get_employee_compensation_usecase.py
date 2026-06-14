from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.personnel.usecases.get_employee_compensation_usecase import GetEmployeeCompensationUseCase
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder


class TestGetEmployeeCompensationUseCase:
    async def test_manager_views_block_member_compensation(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.default_manager
        block = await builder.default_block
        member = await builder.build_user(external_system_id="comp_member")
        await builder.build_block_member(user=member, block=block)
        await builder.build_employee_compensation(user=member, hourly_rate=Decimal("250.00"))
        ctx = builder.auth_context_for(manager)

        result = await GetEmployeeCompensationUseCase(db_session).execute(member.id, ctx)

        assert result is not None
        assert result.hourly_rate == Decimal("250.00")

    async def test_seller_cannot_view_other_compensation(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        other = await builder.build_user(external_system_id="other_comp_user")
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await GetEmployeeCompensationUseCase(db_session).execute(other.id, ctx)

    async def test_delegates_to_own_compensation_when_same_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="self_comp_via_delegate")
        await builder.build_employee_compensation(user=seller, hourly_rate=Decimal("111.00"))
        ctx = builder.auth_context_for(seller)

        result = await GetEmployeeCompensationUseCase(db_session).execute(seller.id, ctx)

        assert result is not None
        assert result.hourly_rate == Decimal("111.00")

    async def test_returns_none_when_compensation_not_set(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="no_comp_staff_view")
        ctx = builder.auth_context_for(admin)

        result = await GetEmployeeCompensationUseCase(db_session).execute(seller.id, ctx)

        assert result is None

    async def test_raises_not_found_when_admin_requests_missing_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileNotFoundError):
            await GetEmployeeCompensationUseCase(db_session).execute(uuid4(), ctx)
