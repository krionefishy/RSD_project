from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import AuthContext
from app.locations.db_models import UserLocationModel
from app.personnel.db_models import EmployeeTimeEntryModel
from app.personnel.domain import TimesheetPeriodQuery
from app.personnel.dto import OwnTimesheetDTO
from app.personnel.timesheet_mapper import map_time_entry, sum_worked_hours
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError


class GetOwnTimesheetUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, query: TimesheetPeriodQuery, ctx: AuthContext) -> OwnTimesheetDTO:
        user_result = await self.session.execute(
            select(UserModel)
            .where(UserModel.id == UUID(ctx.user_id))
            .options(selectinload(UserModel.location_assignments).selectinload(UserLocationModel.location))
        )
        user = user_result.scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError()
        if not user.is_active:
            raise ProfileForbiddenError("User account is inactive")

        if query.location_id is not None:
            location = user.location
            if location is None or location.id != query.location_id:
                return OwnTimesheetDTO(
                    items=[],
                    period_from=query.period_from,
                    period_to=query.period_to,
                    total_hours=sum_worked_hours([]),
                )

        statement = (
            select(EmployeeTimeEntryModel)
            .where(
                EmployeeTimeEntryModel.user_id == user.id,
                EmployeeTimeEntryModel.work_date >= query.period_from,
                EmployeeTimeEntryModel.work_date <= query.period_to,
            )
            .options(
                selectinload(EmployeeTimeEntryModel.activity_code_ref),
                selectinload(EmployeeTimeEntryModel.user).selectinload(
                    UserModel.location_assignments
                ).selectinload(UserLocationModel.location),
            )
            .order_by(EmployeeTimeEntryModel.work_date)
        )
        result = await self.session.execute(statement)
        entries = list(result.scalars().all())
        return OwnTimesheetDTO(
            items=[map_time_entry(entry) for entry in entries],
            period_from=query.period_from,
            period_to=query.period_to,
            total_hours=sum_worked_hours(entries),
        )
