"""Create EmployeeEarningEvent rows from EmployeeTimeEntry rows.

For each time entry with is_paid=True and is_worked_time=True (i.e. actual work
hours, not absence/day-off), we compute:
  - day hours   → hourly_rate * hours
  - night hours → night_hourly_rate * hours  (if shift_type == 'night')

One event per time entry is created. Idempotent: skips entries that already have
a corresponding event (source_type='time_entry', source_id=<entry.id>).
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.personnel.db_models import (
    ActivityCodeModel,
    EmployeeCompensationModel,
    EmployeeEarningEventModel,
    EmployeeTimeEntryModel,
    EarningType,
    EarningSourceType,
    ShiftType,
)


class CreateHourlyEarningEventsUseCase:
    """Create hourly earning events for a user from unprocessed time entries."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        user_id: UUID,
        year: int,
        month: int,
    ) -> int:
        """Return the number of new events created."""
        compensation_result = await self.session.execute(
            select(EmployeeCompensationModel).where(EmployeeCompensationModel.user_id == user_id)
        )
        compensation = compensation_result.scalar_one_or_none()
        if compensation is None:
            return 0

        entries_result = await self.session.execute(
            select(EmployeeTimeEntryModel)
            .join(
                ActivityCodeModel,
                ActivityCodeModel.code == EmployeeTimeEntryModel.activity_code,
            )
            .where(
                EmployeeTimeEntryModel.user_id == user_id,
                ActivityCodeModel.is_paid.is_(True),
                ActivityCodeModel.is_worked_time.is_(True),
            )
        )
        entries = entries_result.scalars().all()

        if not entries:
            return 0

        existing_source_ids_result = await self.session.execute(
            select(EmployeeEarningEventModel.source_id).where(
                EmployeeEarningEventModel.user_id == user_id,
                EmployeeEarningEventModel.source_type == EarningSourceType.TIME_ENTRY.value,
                EmployeeEarningEventModel.source_id.is_not(None),
            )
        )
        existing_ids: set[int] = {row for row in existing_source_ids_result.scalars().all()}

        created = 0
        for entry in entries:
            if entry.id in existing_ids:
                continue

            entry_date = entry.work_date
            if entry_date.year != year or entry_date.month != month:
                continue

            is_night = entry.shift_type == ShiftType.NIGHT.value
            rate = compensation.effective_night_hourly_rate if is_night else compensation.hourly_rate
            amount = (rate * Decimal(str(entry.hours))).quantize(Decimal("0.01"))

            event = EmployeeEarningEventModel(
                user_id=user_id,
                event_datetime=datetime(entry_date.year, entry_date.month, entry_date.day),
                earning_type=EarningType.HOURLY.value,
                amount=amount,
                description=f"Часовая оплата за {entry_date} ({entry.hours} ч.)",
                source_type=EarningSourceType.TIME_ENTRY.value,
                source_id=entry.id,
            )
            self.session.add(event)
            created += 1

        if created > 0:
            await self.session.commit()
        return created
