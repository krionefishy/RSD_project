from dataclasses import dataclass
from typing import Any

import httpx

from shared.service_auth.token import create_service_token
from shared.settings.config import ReportServiceClientConfig, ServiceJWTConfig


class ReportServiceError(Exception):
    def __init__(self, message: str, *, status_code: int | None = None, detail: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.detail = detail


@dataclass(frozen=True)
class ParsedTimesheetScheduleRow:
    date: str
    employee_external_id: str
    shift_code: str
    starts_at: str | None
    ends_at: str | None
    worked_hours: str


@dataclass(frozen=True)
class ParsedTimesheetScheduleResult:
    point_identifier: str
    point_name: str
    period_from: str | None
    period_to: str | None
    rows: list[ParsedTimesheetScheduleRow]
    raw: dict[str, Any]


class ReportServiceClient:
    """HTTP client for report_service with inter-service JWT."""

    def __init__(
        self,
        client_config: ReportServiceClientConfig,
        service_jwt: ServiceJWTConfig,
    ):
        self._client_config = client_config
        self._service_jwt = service_jwt

    @property
    def enabled(self) -> bool:
        return self._client_config.enabled

    def _auth_header(self) -> dict[str, str]:
        token = create_service_token(self._service_jwt, subject="backend")
        return {"Authorization": f"Bearer {token}"}

    def _base_url(self) -> str:
        return self._client_config.base_url.rstrip("/")

    async def health(self) -> bool:
        if not self.enabled:
            return False
        timeout = httpx.Timeout(self._client_config.timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(f"{self._base_url()}/api/v1/health")
            return response.status_code == 200

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
        if not self.enabled:
            raise ReportServiceError("Report service client is disabled in config")

        files = {
            "file": (
                filename,
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        }
        data = {
            "point_identifier": point_identifier,
            "point_name": point_name,
        }
        if period_from:
            data["period_from"] = period_from
        if period_to:
            data["period_to"] = period_to

        timeout = httpx.Timeout(self._client_config.timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{self._base_url()}/api/v1/reports/timesheet-schedules/parse",
                headers=self._auth_header(),
                files=files,
                data=data,
            )

        if response.status_code >= 400:
            detail: Any
            try:
                detail = response.json()
            except ValueError:
                detail = response.text
            raise ReportServiceError(
                "Report service request failed",
                status_code=response.status_code,
                detail=detail,
            )

        payload = response.json()
        entries = payload.get("entries") or payload.get("rows") or []
        rows = [
            ParsedTimesheetScheduleRow(
                date=row.get("work_date") or row.get("date", ""),
                employee_external_id=row.get("employee_code")
                or row.get("employee_external_id")
                or row.get("employee", ""),
                shift_code=str(row.get("shift_code", "")),
                starts_at=row.get("starts_at"),
                ends_at=row.get("ends_at"),
                worked_hours=str(row.get("worked_hours", "")),
            )
            for row in entries
        ]
        return ParsedTimesheetScheduleResult(
            point_identifier=payload.get("point_identifier", point_identifier),
            point_name=payload.get("point_name", point_name),
            period_from=payload.get("period_from", period_from),
            period_to=payload.get("period_to", period_to),
            rows=rows,
            raw=payload,
        )
