from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.db_models import EmployeeEarningTotalModel
from app.users.profile_scope import ensure_can_view_user_profile


class MonthlyEarningDTO(BaseModel):
    year: int
    month: int
    salary_amount: float
    hourly_amount: float
    bonus_amount: float
    total_amount: float
    updated_at: str


class EmployeeEarningsDTO(BaseModel):
    user_id: str
    months: list[MonthlyEarningDTO]
    total_ytd: float


class GetEmployeeEarningsUseCase:
    """Return earning totals for a given user.

    Admins and managers can see any employee's earnings.
    Users can see their own earnings.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        target_user_id: UUID,
        ctx: AuthContext,
        year: int | None = None,
    ) -> EmployeeEarningsDTO:
        if str(target_user_id) != ctx.user_id:
            await ensure_can_view_user_profile(self.session, ctx, target_user_id)

        query = select(EmployeeEarningTotalModel).where(
            EmployeeEarningTotalModel.user_id == target_user_id
        )
        if year is not None:
            query = query.where(EmployeeEarningTotalModel.year == year)
        query = query.order_by(
            EmployeeEarningTotalModel.year.desc(),
            EmployeeEarningTotalModel.month.desc(),
        )

        result = await self.session.execute(query)
        totals = result.scalars().all()

        months = [
            MonthlyEarningDTO(
                year=t.year,
                month=t.month,
                salary_amount=float(t.salary_amount),
                hourly_amount=float(t.hourly_amount),
                bonus_amount=float(t.bonus_amount),
                total_amount=float(t.total_amount),
                updated_at=t.updated_at.isoformat() if isinstance(t.updated_at, datetime) else str(t.updated_at),
            )
            for t in totals
        ]

        total_ytd = sum(float(t.total_amount) for t in totals)

        return EmployeeEarningsDTO(
            user_id=str(target_user_id),
            months=months,
            total_ytd=total_ytd,
        )
