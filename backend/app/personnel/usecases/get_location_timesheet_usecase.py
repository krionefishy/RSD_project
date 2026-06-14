from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import AuthContext
from app.locations.db_models import LocationModel, UserLocationModel
from app.personnel.db_models import EmployeeTimeEntryModel
from app.personnel.domain import TimesheetPeriodQuery
from app.personnel.dto import LocationTimesheetDTO
from app.personnel.timesheet_mapper import map_time_entry, sum_worked_hours
from app.users.db_models import UserModel, UserRole
from app.users.dto import LocationBriefDTO
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from app.users.profile_scope import ensure_can_view_location


class GetLocationTimesheetUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        location_id: int,
        query: TimesheetPeriodQuery,
        ctx: AuthContext,
    ) -> LocationTimesheetDTO:
        if ctx.role not in {
            UserRole.MANAGER.value,
            UserRole.ADMIN_STAFF.value,
            UserRole.ROOT_ADMIN.value,
            UserRole.SUPER_ADMIN.value,
        }:
            raise ProfileForbiddenError()

        location_result = await self.session.execute(
            select(LocationModel).where(LocationModel.id == location_id)
        )
        location = location_result.scalar_one_or_none()
        if location is None:
            raise ProfileNotFoundError("Location not found")

        await ensure_can_view_location(self.session, ctx, location_id)

        user_ids_result = await self.session.execute(
            select(UserLocationModel.user_id).where(UserLocationModel.location_id == location_id)
        )
        user_ids = [row[0] for row in user_ids_result.all()]
        if not user_ids:
            return LocationTimesheetDTO(
                location=LocationBriefDTO(id=location.id, name=location.name),
                items=[],
                total_hours=sum_worked_hours([]),
            )

        statement = (
            select(EmployeeTimeEntryModel)
            .where(
                EmployeeTimeEntryModel.user_id.in_(user_ids),
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
        return LocationTimesheetDTO(
            location=LocationBriefDTO(id=location.id, name=location.name),
            items=[map_time_entry(entry) for entry in entries],
            total_hours=sum_worked_hours(entries),
        )
