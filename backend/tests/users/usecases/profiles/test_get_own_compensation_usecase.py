from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.profile_errors import ProfileForbiddenError
from app.users.usecases.profiles.get_own_compensation_usecase import GetOwnCompensationUseCase
from tests.builder import Builder


class TestGetOwnCompensationUseCase:
    async def test_returns_compensation_when_exists(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        await builder.build_employee_compensation(
            user=seller,
            base_salary=Decimal("60000.00"),
            hourly_rate=Decimal("350.00"),
            night_hourly_rate=Decimal("400.00"),
        )
        ctx = builder.auth_context_for(seller)

        result = await GetOwnCompensationUseCase(db_session).execute(ctx)

        assert result is not None
        assert result.user_id == seller.id
        assert result.base_salary == Decimal("60000.00")
        assert result.effective_night_hourly_rate == Decimal("400.00")

    async def test_returns_none_when_compensation_missing(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="no_compensation_user")
        ctx = builder.auth_context_for(seller)

        result = await GetOwnCompensationUseCase(db_session).execute(ctx)

        assert result is None

    async def test_uses_hourly_rate_when_night_rate_missing(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="comp_fallback_user")
        await builder.build_employee_compensation(
            user=seller,
            hourly_rate=Decimal("300.00"),
            night_hourly_rate=None,
        )
        ctx = builder.auth_context_for(seller)

        result = await GetOwnCompensationUseCase(db_session).execute(ctx)

        assert result is not None
        assert result.night_hourly_rate is None
        assert result.effective_night_hourly_rate == Decimal("300.00")

    async def test_raises_for_inactive_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="inactive_comp_user",
            is_active=False,
        )
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await GetOwnCompensationUseCase(db_session).execute(ctx)
