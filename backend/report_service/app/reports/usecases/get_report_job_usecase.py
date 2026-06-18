from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.reports.db_models import ReportJobModel


class GetReportJobUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, job_id: UUID) -> ReportJobModel | None:
        result = await self.session.execute(
            select(ReportJobModel).where(ReportJobModel.id == job_id)
        )
        return result.scalar_one_or_none()
