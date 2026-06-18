"""Tests for GetReportExportUseCase."""
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest

from app.reports.usecases.exports.get_report_export_usecase import GetReportExportUseCase
from shared.integrations.report_service.client import ReportServiceError


def _make_s3_client(presigned_url: str = "https://s3.example.com/report.xlsx") -> MagicMock:
    mock = MagicMock()
    mock.generate_presigned_url = MagicMock(return_value=presigned_url)
    return mock


class TestGetReportExportUseCase:
    async def test_returns_presigned_url_when_completed(self) -> None:
        job_id = uuid4()
        s3_key = f"learning_reports/{job_id}/learning_users.xlsx"
        fake_url = "https://s3.example.com/signed-url"

        client = AsyncMock()
        client.get_report_job = AsyncMock(return_value={
            "job_id": str(job_id),
            "parse_status": "completed",
            "report_type": "learning_users",
            "s3_file_key": s3_key,
        })
        s3 = _make_s3_client(presigned_url=fake_url)

        uc = GetReportExportUseCase(report_service_client=client, s3_client=s3)
        result = await uc.execute(job_id)

        assert result.job_id == job_id
        assert result.parse_status == "completed"
        assert result.presigned_url == fake_url
        s3.generate_presigned_url.assert_called_once_with(
            key=s3_key,
            expiration=3600,
            response_content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            response_disposition='attachment; filename="learning_users.xlsx"',
        )

    async def test_returns_none_presigned_url_when_pending(self) -> None:
        job_id = uuid4()

        client = AsyncMock()
        client.get_report_job = AsyncMock(return_value={
            "job_id": str(job_id),
            "parse_status": "pending",
            "report_type": "learning_by_block",
            "s3_file_key": None,
        })
        s3 = _make_s3_client()

        uc = GetReportExportUseCase(report_service_client=client, s3_client=s3)
        result = await uc.execute(job_id)

        assert result.parse_status == "pending"
        assert result.presigned_url is None
        s3.generate_presigned_url.assert_not_called()

    async def test_returns_none_presigned_url_when_processing(self) -> None:
        job_id = uuid4()

        client = AsyncMock()
        client.get_report_job = AsyncMock(return_value={
            "job_id": str(job_id),
            "parse_status": "processing",
            "report_type": "learning_rating",
            "s3_file_key": None,
        })
        s3 = _make_s3_client()

        uc = GetReportExportUseCase(report_service_client=client, s3_client=s3)
        result = await uc.execute(job_id)

        assert result.parse_status == "processing"
        assert result.presigned_url is None

    async def test_propagates_report_service_error_on_not_found(self) -> None:
        job_id = uuid4()

        client = AsyncMock()
        client.get_report_job = AsyncMock(
            side_effect=ReportServiceError("Report job not found", status_code=404)
        )
        s3 = _make_s3_client()

        uc = GetReportExportUseCase(report_service_client=client, s3_client=s3)

        with pytest.raises(ReportServiceError) as exc_info:
            await uc.execute(job_id)
        assert exc_info.value.status_code == 404
