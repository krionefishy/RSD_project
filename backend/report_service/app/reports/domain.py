from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class ParsedReportPayload(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(ge=0)


class ShiftCode(StrEnum):
    S1 = "С1"
    S2 = "С2"
    DAY_OFF = "В"
    ABSENCE = "О/Б"


class TimesheetScheduleEntry(BaseModel):
    work_date: str
    employee_code: str
    employee_name: str
    shift_code: ShiftCode
    starts_at: str | None = None
    ends_at: str | None = None
    worked_hours: Decimal = Field(ge=0)


class TimesheetScheduleParseError(BaseModel):
    row: int | None = None
    column: str | None = None
    message: str


class TimesheetSchedulePayload(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(ge=0)
    point_identifier: str
    point_name: str
    period: str | None = None
    shifts: dict[str, dict[str, str]]
    entries: list[TimesheetScheduleEntry]
    errors: list[TimesheetScheduleParseError] = Field(default_factory=list)
