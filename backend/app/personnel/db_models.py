from datetime import date, datetime, time
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Time,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from storage.pg.database import Base

if TYPE_CHECKING:
    from app.users.db_models import UserModel


class ActivityEntryType(StrEnum):
    WORK = "work"
    ABSENCE = "absence"
    DAY_OFF = "day_off"


class ShiftType(StrEnum):
    DAY = "day"
    NIGHT = "night"
    NONE = "none"


class ScheduleShiftCode(StrEnum):
    S1 = "С1"
    S2 = "С2"
    DAY_OFF = "В"
    ABSENCE = "О/Б"


class EarningType(StrEnum):
    SALARY = "salary"
    HOURLY = "hourly"
    BONUS = "bonus"
    MANUAL = "manual"


class EarningSourceType(StrEnum):
    TIME_ENTRY = "time_entry"
    SALES_PLAN_BONUS = "sales_plan_bonus"
    MANUAL = "manual"


class EmployeeCompensationModel(Base):
    __tablename__ = "employee_compensations"

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_employee_compensations_user"),
        CheckConstraint("base_salary >= 0", name="ck_employee_compensations_base_salary_non_negative"),
        CheckConstraint("hourly_rate >= 0", name="ck_employee_compensations_hourly_rate_non_negative"),
        CheckConstraint(
            "night_hourly_rate IS NULL OR night_hourly_rate >= 0",
            name="ck_employee_compensations_night_rate_non_negative",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    base_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    hourly_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    night_hourly_rate: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    user: Mapped["UserModel"] = relationship("UserModel", back_populates="compensation")

    @property
    def effective_night_hourly_rate(self) -> Decimal:
        return self.night_hourly_rate if self.night_hourly_rate is not None else self.hourly_rate


class ActivityCodeModel(Base):
    __tablename__ = "activity_codes"

    __table_args__ = (
        CheckConstraint("entry_type IN ('work', 'absence', 'day_off')", name="ck_activity_codes_entry_type_valid"),
        CheckConstraint(
            "default_hours IS NULL OR default_hours >= 0",
            name="ck_activity_codes_default_hours_non_negative",
        ),
    )

    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    entry_type: Mapped[str] = mapped_column(String(20), nullable=False)
    default_hours: Mapped[Decimal | None] = mapped_column(Numeric(4, 2))
    is_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_worked_time: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    time_entries: Mapped[list["EmployeeTimeEntryModel"]] = relationship(
        "EmployeeTimeEntryModel",
        back_populates="activity_code_ref",
    )


class EmployeeTimeEntryModel(Base):
    __tablename__ = "employee_time_entries"

    __table_args__ = (
        Index(
            "uq_employee_time_entries_user_date_shift_code",
            "user_id",
            "work_date",
            "shift_code",
            unique=True,
            postgresql_where=text("shift_code IN ('С1', 'С2')"),
        ),
        Index(
            "uq_employee_time_entries_user_date_non_work",
            "user_id",
            "work_date",
            unique=True,
            postgresql_where=text("shift_type = 'none'"),
        ),
        Index("ix_employee_time_entries_work_date", "work_date"),
        Index("ix_employee_time_entries_user_work_date", "user_id", "work_date"),
        CheckConstraint("hours >= 0", name="ck_employee_time_entries_hours_non_negative"),
        CheckConstraint("shift_type IN ('day', 'night', 'none')", name="ck_employee_time_entries_shift_type_valid"),
        CheckConstraint(
            "shift_code IS NULL OR shift_code IN ('С1', 'С2', 'В', 'О/Б')",
            name="ck_employee_time_entries_shift_code_valid",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    work_date: Mapped[date] = mapped_column(Date, nullable=False)
    activity_code: Mapped[str] = mapped_column(
        String(10),
        ForeignKey("activity_codes.code"),
        nullable=False,
    )
    hours: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False)
    shift_type: Mapped[str] = mapped_column(String(20), nullable=False, default=ShiftType.NONE.value)
    shift_code: Mapped[str | None] = mapped_column(String(10))
    starts_at: Mapped[time | None] = mapped_column(Time)
    ends_at: Mapped[time | None] = mapped_column(Time)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    user: Mapped["UserModel"] = relationship("UserModel", back_populates="time_entries")
    activity_code_ref: Mapped["ActivityCodeModel"] = relationship("ActivityCodeModel", back_populates="time_entries")


class EmployeeEarningEventModel(Base):
    __tablename__ = "employee_earning_events"

    __table_args__ = (
        Index("ix_employee_earning_events_user_datetime", "user_id", "event_datetime"),
        Index("ix_employee_earning_events_source", "source_type", "source_id"),
        CheckConstraint(
            "earning_type IN ('salary', 'hourly', 'bonus', 'manual')", name="ck_employee_earning_events_type_valid"
        ),
        CheckConstraint("amount >= 0", name="ck_employee_earning_events_amount_non_negative"),
        CheckConstraint(
            "source_type IS NULL OR source_type IN ('time_entry', 'sales_plan_bonus', 'manual')",
            name="ck_employee_earning_events_source_type_valid",
        ),
        CheckConstraint(
            "(source_type IS NULL AND source_id IS NULL) OR (source_type IS NOT NULL)",
            name="ck_employee_earning_events_source_id_requires_type",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    earning_type: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    source_type: Mapped[str | None] = mapped_column(String(50))
    source_id: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())

    user: Mapped["UserModel"] = relationship("UserModel", back_populates="earning_events")


class EmployeeEarningTotalModel(Base):
    __tablename__ = "employee_earning_totals"

    __table_args__ = (
        UniqueConstraint("user_id", "year", "month", name="uq_employee_earning_totals_user_year_month"),
        Index("ix_employee_earning_totals_year_month", "year", "month"),
        CheckConstraint("year >= 2000", name="ck_employee_earning_totals_year_valid"),
        CheckConstraint("month BETWEEN 1 AND 12", name="ck_employee_earning_totals_month_valid"),
        CheckConstraint("salary_amount >= 0", name="ck_employee_earning_totals_salary_non_negative"),
        CheckConstraint("hourly_amount >= 0", name="ck_employee_earning_totals_hourly_non_negative"),
        CheckConstraint("bonus_amount >= 0", name="ck_employee_earning_totals_bonus_non_negative"),
        CheckConstraint("total_amount >= 0", name="ck_employee_earning_totals_total_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    salary_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    hourly_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    bonus_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    user: Mapped["UserModel"] = relationship("UserModel", back_populates="earning_totals")
