from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.timesheets.upload_timesheet_file_usecase import (
    UploadTimesheetFileUseCase,
)
from app.personnel.db_models import ScheduleShiftCode
from app.users.profile_errors import ProfileForbiddenError
from shared.integrations.report_service import ParsedTimesheetScheduleRow
from tests.builder import Builder
from tests.mocks.report_service import FakeReportServiceClient


class TestUploadTimesheetFileUseCase:
    async def test_imports_parsed_rows(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        location = await builder.default_location
        seller = await builder.default_seller
        await builder.build_user_location(user=seller, location=location)
        await builder.default_activity_code
        ctx = builder.auth_context_for(admin)

        report_service = FakeReportServiceClient(
            rows=[
                ParsedTimesheetScheduleRow(
                    date="2024-10-01",
                    employee_external_id=seller.external_system_id,
                    shift_code=ScheduleShiftCode.S1.value,
                    starts_at="09:00",
                    ends_at="18:00",
                    worked_hours="8",
                )
            ]
        )

        result = await UploadTimesheetFileUseCase(db_session, report_service).execute(
            ctx,
            filename="october.xlsx",
            payload=b"xlsx-content",
            period_from=date(2024, 10, 1),
            period_to=date(2024, 10, 31),
            location_id=location.id,
        )

        assert result.entries_count == 1
        assert result.rows_count == 1
        assert result.errors == []

    async def test_raises_when_location_id_missing(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UploadTimesheetFileUseCase(db_session, FakeReportServiceClient()).execute(
                ctx,
                filename="october.xlsx",
                payload=b"xlsx-content",
                period_from=date(2024, 10, 1),
                period_to=date(2024, 10, 31),
            )

        assert exc_info.value.status_code == 422

    async def test_raises_for_invalid_extension(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        location = await builder.default_location
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UploadTimesheetFileUseCase(db_session, FakeReportServiceClient()).execute(
                ctx,
                filename="timesheet.csv",
                payload=b"csv",
                period_from=date(2024, 10, 1),
                period_to=date(2024, 10, 31),
                location_id=location.id,
            )

        assert exc_info.value.status_code == 422

    async def test_raises_when_period_from_after_period_to(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        location = await builder.default_location
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UploadTimesheetFileUseCase(db_session, FakeReportServiceClient()).execute(
                ctx,
                filename="bad.xlsx",
                payload=b"xlsx",
                period_from=date(2024, 10, 31),
                period_to=date(2024, 10, 1),
                location_id=location.id,
            )

        assert exc_info.value.status_code == 422

    async def test_raises_for_empty_file(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        location = await builder.default_location
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UploadTimesheetFileUseCase(db_session, FakeReportServiceClient()).execute(
                ctx,
                filename="empty.xlsx",
                payload=b"",
                period_from=date(2024, 10, 1),
                period_to=date(2024, 10, 31),
                location_id=location.id,
            )

        assert exc_info.value.status_code == 422

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        location = await builder.default_location
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await UploadTimesheetFileUseCase(db_session, FakeReportServiceClient()).execute(
                ctx,
                filename="seller.xlsx",
                payload=b"xlsx",
                period_from=date(2024, 10, 1),
                period_to=date(2024, 10, 31),
                location_id=location.id,
            )
