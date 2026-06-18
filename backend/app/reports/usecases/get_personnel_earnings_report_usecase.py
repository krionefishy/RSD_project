"""Read employee_earning_totals and produce an aggregated personnel earnings report."""
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.personnel.db_models import EmployeeEarningTotalModel
from app.users.db_models import UserModel


class PersonnelEarningsReportItem(BaseModel):
    user_id: str
    user_name: str
    external_system_id: str
    year: int
    month: int
    salary_amount: float
    hourly_amount: float
    bonus_amount: float
    total_amount: float


class PersonnelEarningsReportDTO(BaseModel):
    items: list[PersonnelEarningsReportItem]
    total_count: int
    grand_total: float


class GetPersonnelEarningsReportUseCase:
    """Return a flat list of all earning totals for a given year/month."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        year: Optional[int] = None,
        month: Optional[int] = None,
    ) -> PersonnelEarningsReportDTO:
        query = select(EmployeeEarningTotalModel)
        if year is not None:
            query = query.where(EmployeeEarningTotalModel.year == year)
        if month is not None:
            query = query.where(EmployeeEarningTotalModel.month == month)
        query = query.order_by(
            EmployeeEarningTotalModel.year.desc(),
            EmployeeEarningTotalModel.month.desc(),
            EmployeeEarningTotalModel.total_amount.desc(),
        )

        result = await self.session.execute(query)
        totals = result.scalars().all()

        if not totals:
            return PersonnelEarningsReportDTO(items=[], total_count=0, grand_total=0.0)

        user_ids = list({t.user_id for t in totals})
        users_result = await self.session.execute(
            select(UserModel).where(UserModel.id.in_(user_ids))
        )
        users_map = {str(u.id): u for u in users_result.scalars().all()}

        items = []
        grand_total = 0.0
        for t in totals:
            user = users_map.get(str(t.user_id))
            grand_total += float(t.total_amount)
            items.append(
                PersonnelEarningsReportItem(
                    user_id=str(t.user_id),
                    user_name=user.full_name if user else str(t.user_id),
                    external_system_id=user.external_system_id if user else "",
                    year=t.year,
                    month=t.month,
                    salary_amount=float(t.salary_amount),
                    hourly_amount=float(t.hourly_amount),
                    bonus_amount=float(t.bonus_amount),
                    total_amount=float(t.total_amount),
                )
            )

        return PersonnelEarningsReportDTO(
            items=items,
            total_count=len(items),
            grand_total=round(grand_total, 2),
        )
