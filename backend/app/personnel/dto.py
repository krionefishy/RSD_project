from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.users.dto import LocationBriefDTO, UserBriefDTO, UserProfileDTO


class EmployeeCompensationDTO(BaseModel):
    user_id: UUID
    base_salary: Decimal
    hourly_rate: Decimal
    night_hourly_rate: Decimal | None = None
    effective_night_hourly_rate: Decimal
    updated_at: datetime


class EmployeeTimeEntryDTO(BaseModel):
    id: int
    user_id: UUID
    user: UserBriefDTO
    location: LocationBriefDTO | None = None
    work_date: date
    activity_code: str
    activity_name: str
    hours: Decimal
    shift_type: str
    comment: str | None = None
    timesheet_upload_id: int | None = None
    created_at: datetime
    updated_at: datetime


class OwnTimesheetDTO(BaseModel):
    items: list[EmployeeTimeEntryDTO]
    period_from: date
    period_to: date
    total_hours: Decimal


class LocationTimesheetDTO(BaseModel):
    location: LocationBriefDTO
    items: list[EmployeeTimeEntryDTO]
    total_hours: Decimal


class EmployeeTimesheetDTO(BaseModel):
    user: UserProfileDTO
    items: list[EmployeeTimeEntryDTO]
    total_hours: Decimal


class TimesheetImportErrorDTO(BaseModel):
    row: int | None = None
    column: str | None = None
    message: str


class TimesheetUploadResultDTO(BaseModel):
    upload_id: int
    status: str
    rows_count: int
    errors: list[TimesheetImportErrorDTO]


class DeleteResultDTO(BaseModel):
    deleted: bool


class CreateEmployeeProfileResultDTO(BaseModel):
    user: UserProfileDTO
    temp_password: str
