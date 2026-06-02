from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import AuthContext
from app.locations.db_models import UserLocationModel
from app.personnel.db_models import EmployeeTimeEntryModel
from app.personnel.domain import TimesheetPeriodQuery
from app.personnel.dto import EmployeeTimesheetDTO
from app.personnel.timesheet_mapper import map_time_entry, sum_worked_hours
from app.users.db_models import UserModel, UserRole
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from app.users.profile_mapper import load_user_for_profile, map_user_profile
from app.users.profile_scope import ensure_can_view_user_profile
from app.users.usecases.profiles.get_own_timesheet_usecase import GetOwnTimesheetUseCase


class GetEmployeeTimesheetUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        target_user_id: UUID,
        query: TimesheetPeriodQuery,
        ctx: AuthContext,
    ) -> EmployeeTimesheetDTO:
        if str(target_user_id) == ctx.user_id:
            own = await GetOwnTimesheetUseCase(self.session).execute(query, ctx)
            profile = await load_user_for_profile(self.session, target_user_id)
            if profile is None:
                raise ProfileNotFoundError()
            return EmployeeTimesheetDTO(
                user=map_user_profile(profile),
                items=own.items,
                total_hours=own.total_hours,
            )

        if ctx.role not in {
            UserRole.MANAGER.value,
            UserRole.ADMIN_STAFF.value,
            UserRole.ROOT_ADMIN.value,
            UserRole.SUPER_ADMIN.value,
        }:
            raise ProfileForbiddenError()

        await ensure_can_view_user_profile(self.session, ctx, target_user_id)
        profile_model = await load_user_for_profile(self.session, target_user_id)
        if profile_model is None:
            raise ProfileNotFoundError()

        if query.location_id is not None:
            location = profile_model.location
            if location is None or location.id != query.location_id:
                return EmployeeTimesheetDTO(
                    user=map_user_profile(profile_model),
                    items=[],
                    total_hours=sum_worked_hours([]),
                )

        statement = (
            select(EmployeeTimeEntryModel)
            .where(
                EmployeeTimeEntryModel.user_id == target_user_id,
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
        return EmployeeTimesheetDTO(
            user=map_user_profile(profile_model),
            items=[map_time_entry(entry) for entry in entries],
            total_hours=sum_worked_hours(entries),
        )
