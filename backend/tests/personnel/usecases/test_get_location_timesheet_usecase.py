from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.personnel.domain import TimesheetPeriodQuery
from app.personnel.usecases.get_location_timesheet_usecase import GetLocationTimesheetUseCase
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder


class TestGetLocationTimesheetUseCase:
    async def test_returns_entries_for_location_users(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.default_manager
        block = await builder.default_block
        seller, location, _ = await builder.build_user_with_location(
            user_kwargs={"external_system_id": "loc_timesheet_user"},
        )
        await builder.build_block_location(block=block, location=location)
        await builder.build_time_entry(user=seller, work_date=date(2024, 10, 3))
        ctx = builder.auth_context_for(manager)
        query = TimesheetPeriodQuery(period_from=date(2024, 10, 1), period_to=date(2024, 10, 31))

        result = await GetLocationTimesheetUseCase(db_session).execute(location.id, query, ctx)

        assert result.location.id == location.id
        assert len(result.items) == 1
        assert result.total_hours == Decimal("8.00")

    async def test_returns_empty_when_location_has_no_users(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        location = await builder.build_location(code="EMPTY_LOC", name="Empty Office")
        ctx = builder.auth_context_for(admin)
        query = TimesheetPeriodQuery(period_from=date(2024, 10, 1), period_to=date(2024, 10, 31))

        result = await GetLocationTimesheetUseCase(db_session).execute(location.id, query, ctx)

        assert result.items == []
        assert result.total_hours == Decimal("0")

    async def test_manager_cannot_view_location_outside_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.default_manager
        foreign_location = await builder.build_location(code="FOREIGN", name="Foreign Office")
        ctx = builder.auth_context_for(manager)
        query = TimesheetPeriodQuery(period_from=date(2024, 10, 1), period_to=date(2024, 10, 31))

        with pytest.raises(ProfileForbiddenError):
            await GetLocationTimesheetUseCase(db_session).execute(
                foreign_location.id,
                query,
                ctx,
            )
