from __future__ import annotations

from datetime import date
from decimal import Decimal  # noqa: TC003
from uuid import UUID  # noqa: TC003

from pydantic import BaseModel, Field, model_validator

from app.locations.db_models import BlockMemberStatus
from app.users.db_models import UserRole


class TimesheetPeriodQuery(BaseModel):
    period_from: date
    period_to: date
    location_id: int | None = None

    @model_validator(mode="after")
    def validate_period(self) -> TimesheetPeriodQuery:
        if self.period_from > self.period_to:
            raise ValueError("period_from must be <= period_to")
        delta = (self.period_to - self.period_from).days
        if delta > 93:
            raise ValueError("period must not exceed 93 days")
        return self


class CreateEmployeeProfileRequest(BaseModel):
    external_system_id: str = Field(min_length=1, max_length=255)
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    birth_date: date | None = None
    position: str | None = None
    role: UserRole = UserRole.SELLER
    location_id: int | None = None
    block_id: int | None = None
    block_member_status: str = BlockMemberStatus.PRIMARY.value

    @model_validator(mode="after")
    def validate_request(self) -> CreateEmployeeProfileRequest:
        self.external_system_id = self.external_system_id.strip()
        if not self.external_system_id:
            raise ValueError("external_system_id must not be empty")
        if self.role != UserRole.SELLER:
            raise ValueError("only seller role can be created")
        status = self.block_member_status.strip().lower()
        allowed = {BlockMemberStatus.PRIMARY.value, BlockMemberStatus.RESERVE.value}
        if status not in allowed:
            raise ValueError("block_member_status must be primary or reserve")
        self.block_member_status = status
        if self.birth_date is not None and self.birth_date > date.today():
            raise ValueError("birth_date cannot be in the future")
        return self


class UpdateEmployeeProfileRequest(BaseModel):
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    birth_date: date | None = None
    position: str | None = None
    location_id: int | None = None
    block_id: int | None = None
    block_member_status: str | None = None

    @model_validator(mode="after")
    def validate_request(self) -> UpdateEmployeeProfileRequest:
        if self.block_member_status is not None:
            status = self.block_member_status.strip().lower()
            allowed = {BlockMemberStatus.PRIMARY.value, BlockMemberStatus.RESERVE.value}
            if status not in allowed:
                raise ValueError("block_member_status must be primary or reserve")
            self.block_member_status = status
        if self.birth_date is not None and self.birth_date > date.today():
            raise ValueError("birth_date cannot be in the future")
        return self


class UpsertEmployeeCompensationRequest(BaseModel):
    base_salary: Decimal = Field(ge=0)
    hourly_rate: Decimal = Field(ge=0)
    night_hourly_rate: Decimal | None = Field(default=None, ge=0)


class UpdateTimeEntryRequest(BaseModel):
    activity_code: str | None = None
    hours: Decimal | None = Field(default=None, ge=0)
    shift_type: str | None = None


class CreateTimeEntryRequest(BaseModel):
    user_id: UUID
    work_date: date
    shift_code: str
    location_id: int | None = None

    @model_validator(mode="after")
    def validate_shift_code(self) -> CreateTimeEntryRequest:
        if self.shift_code not in {"С1", "С2"}:
            raise ValueError("shift_code must be С1 or С2")
        return self


class ChangeBlockMemberStatusRequest(BaseModel):
    block_id: int
    status: str

    @model_validator(mode="after")
    def validate_status(self) -> ChangeBlockMemberStatusRequest:
        status = self.status.strip().lower()
        allowed = {BlockMemberStatus.PRIMARY.value, BlockMemberStatus.RESERVE.value}
        if status not in allowed:
            raise ValueError("status must be primary or reserve")
        self.status = status
        return self


class ChangeEmployeePositionRequest(BaseModel):
    position: str = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def validate_position(self) -> ChangeEmployeePositionRequest:
        value = self.position.strip()
        if not value:
            raise ValueError("position must not be empty")
        self.position = value
        return self


ALLOWED_AVATAR_CONTENT_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
MAX_AVATAR_BYTES = 5 * 1024 * 1024
