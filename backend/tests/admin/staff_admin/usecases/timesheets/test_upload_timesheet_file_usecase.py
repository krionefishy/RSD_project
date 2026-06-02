from __future__ import annotations

from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.timesheets.upload_timesheet_file_usecase import (
    UploadTimesheetFileUseCase,
)
from app.users.profile_errors import ProfileForbiddenError
from tests.builder import Builder
from tests.mocks import MockS3Client


class TestUploadTimesheetFileUseCase:
    async def test_uploads_xlsx_and_creates_record(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        result = await UploadTimesheetFileUseCase(db_session, MockS3Client()).execute(
            ctx,
            filename="october.xlsx",
            payload=b"xlsx-content",
            period_from=date(2024, 10, 1),
            period_to=date(2024, 10, 31),
        )

        assert result.upload_id > 0
        assert result.status == "uploaded"
        assert result.rows_count == 0
        assert result.errors == []

    async def test_raises_for_invalid_extension(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UploadTimesheetFileUseCase(db_session, MockS3Client()).execute(
                ctx,
                filename="timesheet.csv",
                payload=b"csv",
                period_from=date(2024, 10, 1),
                period_to=date(2024, 10, 31),
            )

        assert exc_info.value.status_code == 422

    async def test_raises_when_period_from_after_period_to(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UploadTimesheetFileUseCase(db_session, MockS3Client()).execute(
                ctx,
                filename="bad.xlsx",
                payload=b"xlsx",
                period_from=date(2024, 10, 31),
                period_to=date(2024, 10, 1),
            )

        assert exc_info.value.status_code == 422

    async def test_raises_for_empty_file(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UploadTimesheetFileUseCase(db_session, MockS3Client()).execute(
                ctx,
                filename="empty.xlsx",
                payload=b"",
                period_from=date(2024, 10, 1),
                period_to=date(2024, 10, 31),
            )

        assert exc_info.value.status_code == 422

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await UploadTimesheetFileUseCase(db_session, MockS3Client()).execute(
                ctx,
                filename="seller.xlsx",
                payload=b"xlsx",
                period_from=date(2024, 10, 1),
                period_to=date(2024, 10, 31),
            )
