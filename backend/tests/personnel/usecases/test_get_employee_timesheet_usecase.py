from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.personnel.domain import TimesheetPeriodQuery
from app.personnel.usecases.get_employee_timesheet_usecase import GetEmployeeTimesheetUseCase
from app.users.profile_errors import ProfileNotFoundError
from tests.builder import Builder


class TestGetEmployeeTimesheetUseCase:
    async def test_manager_views_employee_timesheet(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.default_manager
        block = await builder.default_block
        member = await builder.build_user(external_system_id="emp_timesheet_user")
        await builder.build_block_member(user=member, block=block)
        await builder.build_time_entry(user=member, work_date=date(2024, 10, 8))
        ctx = builder.auth_context_for(manager)
        query = TimesheetPeriodQuery(period_from=date(2024, 10, 1), period_to=date(2024, 10, 31))

        result = await GetEmployeeTimesheetUseCase(db_session).execute(member.id, query, ctx)

        assert result.user.id == member.id
        assert len(result.items) == 1
        assert result.total_hours == Decimal("8.00")

    async def test_seller_can_view_own_timesheet_via_delegate(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="self_timesheet_delegate")
        await builder.build_time_entry(user=seller, work_date=date(2024, 10, 12))
        ctx = builder.auth_context_for(seller)
        query = TimesheetPeriodQuery(period_from=date(2024, 10, 1), period_to=date(2024, 10, 31))

        result = await GetEmployeeTimesheetUseCase(db_session).execute(seller.id, query, ctx)

        assert result.user.id == seller.id
        assert len(result.items) == 1

    async def test_raises_not_found_for_missing_employee(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)
        query = TimesheetPeriodQuery(period_from=date(2024, 10, 1), period_to=date(2024, 10, 31))

        with pytest.raises(ProfileNotFoundError):
            await GetEmployeeTimesheetUseCase(db_session).execute(uuid4(), query, ctx)
