from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import AuthContext
from app.locations.db_models import UserLocationModel
from app.personnel.db_models import ActivityCodeModel, ActivityEntryType, EmployeeTimeEntryModel, ShiftType
from app.personnel.domain import UpdateTimeEntryRequest
from app.personnel.dto import EmployeeTimeEntryDTO
from app.personnel.timesheet_mapper import map_time_entry
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileConflictError, ProfileNotFoundError
from app.users.profile_scope import require_staff_admin


class UpdateTimeEntryUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        time_entry_id: int,
        request: UpdateTimeEntryRequest,
        ctx: AuthContext,
    ) -> EmployeeTimeEntryDTO:
        require_staff_admin(ctx)

        result = await self.session.execute(
            select(EmployeeTimeEntryModel)
            .where(EmployeeTimeEntryModel.id == time_entry_id)
            .options(
                selectinload(EmployeeTimeEntryModel.activity_code_ref),
                selectinload(EmployeeTimeEntryModel.user).selectinload(
                    UserModel.location_assignments
                ).selectinload(UserLocationModel.location),
            )
        )
        entry = result.scalar_one_or_none()
        if entry is None:
            raise ProfileNotFoundError("Time entry not found")

        new_code = request.activity_code or entry.activity_code
        new_shift = request.shift_type or entry.shift_type
        new_hours = request.hours if request.hours is not None else entry.hours

        code_result = await self.session.execute(
            select(ActivityCodeModel).where(ActivityCodeModel.code == new_code)
        )
        activity_code = code_result.scalar_one_or_none()
        if activity_code is None:
            raise ProfileNotFoundError("Activity code not found")

        self._validate_activity_shift(activity_code, new_shift)

        dup_result = await self.session.execute(
            select(EmployeeTimeEntryModel.id).where(
                EmployeeTimeEntryModel.user_id == entry.user_id,
                EmployeeTimeEntryModel.work_date == entry.work_date,
                EmployeeTimeEntryModel.shift_type == new_shift,
                EmployeeTimeEntryModel.id != entry.id,
            )
        )
        if dup_result.scalar_one_or_none() is not None:
            raise ProfileConflictError("Duplicate time entry for date and shift")

        entry.activity_code = new_code
        entry.shift_type = new_shift
        entry.hours = new_hours
        if request.comment is not None:
            entry.comment = request.comment
        entry.updated_at = datetime.now()

        await self.session.commit()
        await self.session.refresh(entry)
        await self.session.refresh(entry, attribute_names=["activity_code_ref", "user"])
        return map_time_entry(entry)

    def _validate_activity_shift(self, activity_code: ActivityCodeModel, shift_type: str) -> None:
        allowed_shifts = {ShiftType.DAY.value, ShiftType.NIGHT.value, ShiftType.NONE.value}
        if shift_type not in allowed_shifts:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid shift type",
            )

        if activity_code.code == "Н" and shift_type != ShiftType.NIGHT.value:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Night activity requires night shift",
            )
        if activity_code.code == "Я" and shift_type != ShiftType.DAY.value:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Work activity requires day shift",
            )
        if (
            activity_code.entry_type in {ActivityEntryType.ABSENCE.value, ActivityEntryType.DAY_OFF.value}
            and shift_type != ShiftType.NONE.value
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Absence and day off activities require none shift",
            )
