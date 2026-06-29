from datetime import time
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import AuthContext
from app.locations.db_models import LocationModel, UserLocationModel
from app.personnel.db_models import ActivityCodeModel, EmployeeTimeEntryModel, ScheduleShiftCode, ShiftType
from app.personnel.domain import CreateTimeEntryRequest
from app.personnel.dto import EmployeeTimeEntryDTO
from app.personnel.timesheet_mapper import map_time_entry
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileConflictError, ProfileNotFoundError
from app.users.profile_scope import ensure_staff_admin_can_manage_user, require_staff_admin

WORK_SHIFT_CODES = (ScheduleShiftCode.S1.value, ScheduleShiftCode.S2.value)


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

        existing = await self._find_work_shift_entry(user.id, request.work_date, request.shift_code)

        if existing is not None:
            raise ProfileConflictError("Shift already assigned for this date")

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

        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ProfileConflictError("Shift already assigned for this date") from exc

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

    async def _find_work_shift_entry(
        self,
        user_id,
        work_date,
        shift_code: str,
    ) -> EmployeeTimeEntryModel | None:
        result = await self.session.execute(
            select(EmployeeTimeEntryModel).where(
                EmployeeTimeEntryModel.user_id == user_id,
                EmployeeTimeEntryModel.work_date == work_date,
                EmployeeTimeEntryModel.shift_code == shift_code,
            )
        )
        return result.scalar_one_or_none()

    async def _resolve_location(