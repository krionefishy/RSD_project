"""Tests for RequestReportExportUseCase."""
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import pytest

from app.reports.usecases.exports.request_report_export_usecase import RequestReportExportUseCase
from shared.integrations.report_service.client import ReportServiceError


class TestRequestReportExportUseCase:
    async def test_returns_job_id_from_report_service(self) -> None:
        expected_job_id = uuid4()
        client = AsyncMock()
        client.request_report_generation = AsyncMock(return_value=expected_job_id)

        uc = RequestReportExportUseCase(report_service_client=client)
        result = await uc.execute(
            report_type="learning_users",
            scope_type="network",
        )

        assert result.job_id == expected_job_id
        client.request_report_generation.assert_awaited_once_with(
            report_type="learning_users",
            scope_type="network",
            scope_id=None,
            period_from=None,
            period_to=None,
        )

    async def test_passes_scope_and_period_to_client(self) -> None:
        expected_job_id = uuid4()
        client = AsyncMock()
        client.request_report_generation = AsyncMock(return_value=expected_job_id)

        uc = RequestReportExportUseCase(report_service_client=client)
        result = await uc.execute(
            report_type="learning_by_block",
            scope_type="block",
            scope_id=42,
            period_from="2024-01-01",
            period_to="2024-01-31",
        )

        assert result.job_id == expected_job_id
        client.request_report_generation.assert_awaited_once_with(
            report_type="learning_by_block",
            scope_type="block",
            scope_id=42,
            period_from="2024-01-01",
            period_to="2024-01-31",
        )

    async def test_propagates_report_service_error(self) -> None:
        client = AsyncMock()
        client.request_report_generation = AsyncMock(
            side_effect=ReportServiceError("Service unavailable", status_code=503)
        )

        uc = RequestReportExportUseCase(report_service_client=client)

        with pytest.raises(ReportServiceError):
            await uc.execute(report_type="learning_users")
