from __future__ import annotations

from datetime import date, time
from decimal import Decimal
from typing import TYPE_CHECKING

from fastapi import HTTPException, status
from shared.integrations.report_service import ReportServiceError
from sqlalchemy import delete, select

from app.locations.db_models import LocationModel, UserLocationModel
from app.personnel.db_models import EmployeeTimeEntryModel, ScheduleShiftCode, ShiftType
from app.personnel.dto import TimesheetImportErrorDTO, TimesheetUploadResultDTO
from app.users.db_models import UserModel
from app.users.profile_scope import require_staff_admin

if TYPE_CHECKING:
    from shared.integrations.report_service import ReportServiceClient
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.auth.deps import AuthContext

ALLOWED_EXTENSIONS = {".xlsx"}


class UploadTimesheetFileUseCase:
    def __init__(
        self,
        session: AsyncSession,
        report_service: ReportServiceClient,
    ):
        self.session = session
        self.report_service = report_service

    async def execute(
        self,
        ctx: AuthContext,
        filename: str,
        payload: bytes,
        period_from: date,
        period_to: date,
        location_id: int | None = None,
    ) -> TimesheetUploadResultDTO:
        require_staff_admin(ctx)

        if location_id is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="location_id is required for timesheet schedule import",
            )
        if period_from > period_to:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="period_from must be <= period_to",
            )

        lower_name = filename.lower()
        if not any(lower_name.endswith(ext) for ext in ALLOWED_EXTENSIONS):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Only .xlsx files are supported",
            )
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Empty file",
            )

        location = await self._get_location(location_id)
        try:
            parsed = await self.report_service.parse_timesheet_schedule(
                filename=filename,
                content=payload,
                point_identifier=location.code,
                point_name=location.name,
                period_from=period_from.isoformat(),
                period_to=period_to.isoformat(),
            )
        except ReportServiceError as exc:
            raise HTTPException(
                status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY,
                detail=exc.detail or str(exc),
            ) from exc

        employee_codes = {row.employee_external_id for row in parsed.rows if row.employee_external_id}
        users = await self._load_users(employee_codes)
        errors = [
            TimesheetImportErrorDTO(
                row=None,
                column=code,
                message=f"Employee with external_system_id={code} was not found",
            )
            for code in sorted(employee_codes - set(users))
        ]
        if errors:
            return TimesheetUploadResultDTO(entries_count=0, rows_count=len(parsed.rows), errors=errors)

        location_user_ids = await self._location_user_ids(location_id)
        if location_user_ids:
            await self.session.execute(
                delete(EmployeeTimeEntryModel).where(
                    EmployeeTimeEntryModel.user_id.in_(location_user_ids),
                    EmployeeTimeEntryModel.work_date >= period_from,
                    EmployeeTimeEntryModel.work_date <= period_to,
                )
            )

        entries = [
            EmployeeTimeEntryModel(
                user_id=users[row.employee_external_id].id,
                work_date=date.fromisoformat(row.date),
                activity_code=self._activity_code(row.shift_code),
                hours=Decimal(row.worked_hours),
                shift_type=self._shift_type(row.shift_code),
                shift_code=row.shift_code,
                starts_at=self._parse_time(row.starts_at),
                ends_at=self._parse_time(row.ends_at),
            )
            for row in parsed.rows
        ]
        self.session.add_all(entries)
        await self.session.commit()

        return TimesheetUploadResultDTO(
            entries_count=len(entries),
            rows_count=len(parsed.rows),
            errors=[],
        )

    async def _get_location(self, location_id: int) -> LocationModel:
        result = await self.session.execute(select(LocationModel).where(LocationModel.id == location_id))
        location = result.scalar_one_or_none()
        if location is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found",
            )
        return location

    async def _load_users(self, employee_codes: set[str]) -> dict[str, UserModel]:
        if not employee_codes:
            return {}
        result = await self.session.execute(select(UserModel).where(UserModel.external_system_id.in_(employee_codes)))
        return {user.external_system_id: user for user in result.scalars().all()}

    async def _location_user_ids(self, location_id: int) -> list:
        result = await self.session.execute(
            select(UserLocationModel.user_id).where(UserLocationModel.location_id == location_id)
        )
        return [row[0] for row in result.all()]

    def _activity_code(self, shift_code: str) -> str:
        if shift_code in {ScheduleShiftCode.S1.value, ScheduleShiftCode.S2.value}:
            return "Я"
        if shift_code == ScheduleShiftCode.DAY_OFF.value:
            return "В"
        return "Б"

    def _shift_type(self, shift_code: str) -> str:
        if shift_code in {ScheduleShiftCode.S1.value, ScheduleShiftCode.S2.value}:
            return ShiftType.DAY.value
        return ShiftType.NONE.value

    def _parse_time(self, value: str | None) -> time | None:
        if not value:
            return None
        if value == "24:00":
            return time(0, 0)
        return time.fromisoformat(value)
