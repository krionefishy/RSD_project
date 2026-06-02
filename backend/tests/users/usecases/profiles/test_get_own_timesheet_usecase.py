from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.personnel.domain import TimesheetPeriodQuery
from app.users.usecases.profiles.get_own_timesheet_usecase import GetOwnTimesheetUseCase
from tests.builder import Builder


class TestGetOwnTimesheetUseCase:
    async def test_returns_own_entries_for_period(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 10, 1),
            hours=Decimal("8.00"),
        )
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 10, 2),
            hours=Decimal("4.00"),
        )
        ctx = builder.auth_context_for(seller)
        query = TimesheetPeriodQuery(period_from=date(2024, 10, 1), period_to=date(2024, 10, 31))

        result = await GetOwnTimesheetUseCase(db_session).execute(query, ctx)

        assert len(result.items) == 2
        assert result.total_hours == Decimal("12.00")

    async def test_filters_by_location_id(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller, location, _ = await builder.build_user_with_location(
            user_kwargs={"external_system_id": "timesheet_loc_user"},
        )
        await builder.build_time_entry(user=seller, work_date=date(2024, 10, 5))
        ctx = builder.auth_context_for(seller)
        query = TimesheetPeriodQuery(
            period_from=date(2024, 10, 1),
            period_to=date(2024, 10, 31),
            location_id=location.id,
        )

        result = await GetOwnTimesheetUseCase(db_session).execute(query, ctx)

        assert len(result.items) == 1

    async def test_returns_empty_when_location_mismatch(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        await builder.build_time_entry(user=seller, work_date=date(2024, 10, 5))
        other_location = await builder.build_location(code="OTHER_LOC", name="Other")
        ctx = builder.auth_context_for(seller)
        query = TimesheetPeriodQuery(
            period_from=date(2024, 10, 1),
            period_to=date(2024, 10, 31),
            location_id=other_location.id,
        )

        result = await GetOwnTimesheetUseCase(db_session).execute(query, ctx)

        assert result.items == []
        assert result.total_hours == Decimal("0")

    async def test_raises_when_period_from_after_period_to(
        self,
        builder: Builder,
    ) -> None:
        with pytest.raises(ValidationError):
            TimesheetPeriodQuery(
                period_from=date(2024, 10, 31),
                period_to=date(2024, 10, 1),
            )

    async def test_raises_when_period_exceeds_93_days(
        self,
        builder: Builder,
    ) -> None:
        with pytest.raises(ValidationError):
            TimesheetPeriodQuery(
                period_from=date(2024, 1, 1),
                period_to=date(2024, 4, 15),
            )

    async def test_excludes_entries_outside_period(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        await builder.build_time_entry(user=seller, work_date=date(2024, 9, 30))
        await builder.build_time_entry(user=seller, work_date=date(2024, 10, 15))
        ctx = builder.auth_context_for(seller)
        query = TimesheetPeriodQuery(period_from=date(2024, 10, 1), period_to=date(2024, 10, 31))

        result = await GetOwnTimesheetUseCase(db_session).execute(query, ctx)

        assert len(result.items) == 1
        assert result.items[0].work_date == date(2024, 10, 15)

    async def test_total_hours_excludes_non_worked_activity_codes(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="timesheet_hours_user")
        await builder.build_activity_code(
            code="В",
            name="Выходной",
            is_worked_time=False,
        )
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 10, 10),
            activity_code="Я",
            hours=Decimal("8.00"),
        )
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 10, 11),
            activity_code="В",
            hours=Decimal("8.00"),
        )
        ctx = builder.auth_context_for(seller)
        query = TimesheetPeriodQuery(period_from=date(2024, 10, 1), period_to=date(2024, 10, 31))

        result = await GetOwnTimesheetUseCase(db_session).execute(query, ctx)

        assert len(result.items) == 2
        assert result.total_hours == Decimal("8.00")
