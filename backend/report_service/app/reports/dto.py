from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class ParsedReportDTO(BaseModel):
    id: UUID
    filename: str
    parse_status: str
    size_bytes: int
    uploaded_at: datetime
    message: str


class ShiftCodeDTO(StrEnum):
    S1 = "С1"
    S2 = "С2"
    DAY_OFF = "В"
    ABSENCE = "О/Б"


class TimesheetScheduleEntryDTO(BaseModel):
    work_date: str
    employee_code: str
    employee_name: str
    shift_code: ShiftCodeDTO
    starts_at: str | None = None
    ends_at: str | None = None
    worked_hours: Decimal


class ParsedTimesheetScheduleDTO(BaseModel):
    id: UUID
    filename: str
    file_extension: str
    content_type: str
    parse_status: str
    size_bytes: int
    s3_file_key: str
    point_identifier: str
    point_name: str
    period: str | None = None
    shifts: dict[str, dict[str, str]]
    entries_count: int
    entries: list[TimesheetScheduleEntryDTO]
    uploaded_at: datetime
    completed_at: datetime | None = None


# ---- Learning report DTOs ------------------------------------------------

VALID_REPORT_TYPES = {"learning_users", "learning_by_block", "learning_by_location", "learning_rating"}
VALID_SCOPE_TYPES = {"network", "block", "location"}


class GenerateReportRequest(BaseModel):
    report_type: str = Field(..., description="learning_users | learning_by_block | learning_by_location | learning_rating")
    scope_type: str = Field("network", description="network | block | location")
    scope_id: int | None = Field(None, description="Required when scope_type != network")
    period_from: str | None = None
    period_to: str | None = None


class GenerateReportResponse(BaseModel):
    job_id: UUID


class ReportJobStatusDTO(BaseModel):
    job_id: UUID
    parse_status: str
    report_type: str
    s3_file_key: str | None = None
    params: dict | None = None
    uploaded_at: datetime
    completed_at: datetime | None = None
