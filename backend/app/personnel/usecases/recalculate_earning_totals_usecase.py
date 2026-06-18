"""Aggregate EmployeeEarningEvent rows into EmployeeEarningTotal (one row per user/year/month).

Reads all events for the given user/year/month, sums by earning_type, and upserts
the total row using ON CONFLICT / merge pattern.
"""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.personnel.db_models import (
    EarningType,
    EmployeeEarningEventModel,
    EmployeeEarningTotalModel,
)


class RecalculateEarningTotalsUseCase:
    """Re-aggregate events into totals for a user's month."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        user_id: UUID,
        year: int,
        month: int,
    ) -> EmployeeEarningTotalModel:
        import calendar
        from datetime import datetime

        month_start = datetime(year, month, 1)
        last_day = calendar.monthrange(year, month)[1]
        month_end = datetime(year, month, last_day, 23, 59, 59)

        events_result = await self.session.execute(
            select(EmployeeEarningEventModel).where(
                EmployeeEarningEventModel.user_id == user_id,
                EmployeeEarningEventModel.event_datetime >= month_start,
                EmployeeEarningEventModel.event_datetime <= month_end,
            )
        )
        events = events_result.scalars().all()

        salary_amount = Decimal("0.00")
        hourly_amount = Decimal("0.00")
        bonus_amount = Decimal("0.00")

        for event in events:
            if event.earning_type == EarningType.SALARY.value:
                salary_amount += event.amount
            elif event.earning_type == EarningType.HOURLY.value:
                hourly_amount += event.amount
            elif event.earning_type == EarningType.BONUS.value:
                bonus_amount += event.amount
            # manual events are excluded from structured totals

        total_amount = (salary_amount + hourly_amount + bonus_amount).quantize(Decimal("0.01"))

        existing_result = await self.session.execute(
            select(EmployeeEarningTotalModel).where(
                EmployeeEarningTotalModel.user_id == user_id,
                EmployeeEarningTotalModel.year == year,
                EmployeeEarningTotalModel.month == month,
            )
        )
        existing = existing_result.scalar_one_or_none()

        if existing is None:
            total = EmployeeEarningTotalModel(
                user_id=user_id,
                year=year,
                month=month,
                salary_amount=salary_amount,
                hourly_amount=hourly_amount,
                bonus_amount=bonus_amount,
                total_amount=total_amount,
            )
            self.session.add(total)
        else:
            existing.salary_amount = salary_amount
            existing.hourly_amount = hourly_amount
            existing.bonus_amount = bonus_amount
            existing.total_amount = total_amount
            total = existing

        await self.session.commit()
        await self.session.refresh(total)
        return total
