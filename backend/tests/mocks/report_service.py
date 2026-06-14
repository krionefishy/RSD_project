from dataclasses import dataclass, field

from shared.integrations.report_service import (
    ParsedTimesheetScheduleResult,
    ParsedTimesheetScheduleRow,
    ReportServiceClient,
    ReportServiceError,
)
from shared.settings.config import ReportServiceClientConfig, ServiceJWTConfig


def disabled_report_service_client() -> ReportServiceClient:
    return ReportServiceClient(
        client_config=ReportServiceClientConfig(enabled=False),
        service_jwt=ServiceJWTConfig(secret="test-inter-service-secret"),
    )


@dataclass
class FakeReportServiceClient:
    rows: list[ParsedTimesheetScheduleRow] = field(default_factory=list)
    error: ReportServiceError | None = None

    async def parse_timesheet_schedule(
        self,
        *,
        filename: str,
        content: bytes,
        point_identifier: str,
        point_name: str,
        period_from: str | None = None,
        period_to: str | None = None,
    ) -> ParsedTimesheetScheduleResult:
        if self.error is not None:
            raise self.error
        return ParsedTimesheetScheduleResult(
            point_identifier=point_identifier,
            point_name=point_name,
            period_from=period_from,
            period_to=period_to,
            rows=self.rows,
            raw={},
        )

    @property
    def enabled(self) -> bool:
        return True
