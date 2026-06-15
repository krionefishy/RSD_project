from datetime import datetime, time
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import AuthContext
from app.locations.db_models import LocationModel, UserLocationModel
from app.personnel.db_models import ActivityCodeModel, EmployeeTimeEntryModel, ScheduleShiftCode, ShiftType
from app.personnel.domain import CreateTimeEntryRequest
from app.personnel.dto import EmployeeTimeEntryDTO
from app.personnel.timesheet_mapper import map_time_entry
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileNotFoundError
from app.users.profile_scope import ensure_staff_admin_can_manage_user, require_staff_admin


class CreateTimeEntryUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        request: CreateTimeEntryRequest,
        ctx: AuthContext,
    ) -> EmployeeTimeEntryDTO:
        require_staff_admin(ctx)

        user = (
            await self.session.execute(
                select(UserModel)
                .where(UserModel.id == request.user_id)
                .options(
                    selectinload(UserModel.location_assignments).selectinload(UserLocationModel.location),
                )
            )
        ).scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError("User not found")

        ensure_staff_admin_can_manage_user(ctx, user.role)

        location = await self._resolve_location(user, request.location_id)
        if location is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="User must be assigned to a location before shift assignment",
            )

        code_result = await self.session.execute(
            select(ActivityCodeModel).where(ActivityCodeModel.code == "Я")
        )
        activity_code = code_result.scalar_one_or_none()
        if activity_code is None:
            raise ProfileNotFoundError("Activity code not found")

        starts_at, ends_at = self._shift_bounds(location, request.shift_code)
        hours = self._worked_hours(starts_at, ends_at)

        existing_result = await self.session.execute(
            select(EmployeeTimeEntryModel).where(
                EmployeeTimeEntryModel.user_id == user.id,
                EmployeeTimeEntryModel.work_date == request.work_date,
            )
        )
        existing = existing_result.scalar_one_or_none()

        if existing is not None:
            existing.activity_code = activity_code.code
            existing.hours = hours
            existing.shift_type = ShiftType.DAY.value
            existing.shift_code = request.shift_code
            existing.starts_at = starts_at
            existing.ends_at = ends_at
            existing.updated_at = datetime.now()
            entry = existing
        else:
            entry = EmployeeTimeEntryModel(
                user_id=user.id,
                work_date=request.work_date,
                activity_code=activity_code.code,
                hours=hours,
                shift_type=ShiftType.DAY.value,
                shift_code=request.shift_code,
                starts_at=starts_at,
                ends_at=ends_at,
            )
            self.session.add(entry)

        await self.session.commit()

        result = await self.session.execute(
            select(EmployeeTimeEntryModel)
            .where(EmployeeTimeEntryModel.id == entry.id)
            .options(
                selectinload(EmployeeTimeEntryModel.activity_code_ref),
                selectinload(EmployeeTimeEntryModel.user).selectinload(
                    UserModel.location_assignments
                ).selectinload(UserLocationModel.location),
            )
        )
        loaded = result.scalar_one()
        return map_time_entry(loaded)

    async def _resolve_location(
        self,
        user: UserModel,
        location_id: int | None,
    ) -> LocationModel | None:
        if location_id is not None:
            for assignment in user.location_assignments:
                if assignment.location_id == location_id:
                    return assignment.location
            result = await self.session.execute(
                select(LocationModel).where(LocationModel.id == location_id)
            )
            location = result.scalar_one_or_none()
            if location is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Location not found",
                )
            return location
        return self._user_location(user)

    def _user_location(self, user: UserModel) -> LocationModel | None:
        if not user.location_assignments:
            return None
        return user.location_assignments[0].location

    def _shift_bounds(self, location: LocationModel, shift_code: str) -> tuple[time, time]:
        if shift_code == ScheduleShiftCode.S1.value:
            return location.s1_start_at, location.s1_end_at
        if shift_code == ScheduleShiftCode.S2.value:
            return location.s2_start_at, location.s2_end_at
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="shift_code must be С1 or С2",
        )

    def _worked_hours(self, starts_at: time, ends_at: time) -> Decimal:
        start_minutes = starts_at.hour * 60 + starts_at.minute
        end_minutes = ends_at.hour * 60 + ends_at.minute
        if end_minutes <= start_minutes:
            end_minutes += 24 * 60
        minutes = end_minutes - start_minutes
        return (Decimal(minutes) / Decimal(60)).quantize(Decimal("0.01"))
