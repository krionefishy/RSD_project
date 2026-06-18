from dataclasses import dataclass
from uuid import UUID

from shared.integrations.report_service.client import ReportServiceClient


@dataclass
class ReportExportRequestDTO:
    job_id: UUID


class RequestReportExportUseCase:
    def __init__(self, report_service_client: ReportServiceClient):
        self._client = report_service_client

    async def execute(
        self,
        report_type: str,
        scope_type: str = "network",
        scope_id: int | None = None,
        period_from: str | None = None,
        period_to: str | None = None,
    ) -> ReportExportRequestDTO:
        job_id = await self._client.request_report_generation(
            report_type=report_type,
            scope_type=scope_type,
            scope_id=scope_id,
            period_from=period_from,
            period_to=period_to,
        )
        return ReportExportRequestDTO(job_id=job_id)
