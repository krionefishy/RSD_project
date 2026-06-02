from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.db_models import TimesheetUploadModel, TimesheetUploadStatus
from app.personnel.dto import TimesheetUploadResultDTO
from app.users.profile_scope import require_staff_admin
from storage.s3.client import S3Client

ALLOWED_EXTENSIONS = {".xls", ".xlsx"}


class UploadTimesheetFileUseCase:
    def __init__(self, session: AsyncSession, s3_client: S3Client | None):
        self.session = session
        self.s3_client = s3_client

    async def execute(
        self,
        ctx: AuthContext,
        filename: str,
        payload: bytes,
        period_from,
        period_to,
        location_id: int | None = None,
    ) -> TimesheetUploadResultDTO:
        require_staff_admin(ctx)

        if self.s3_client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 storage is not configured",
            )
        if period_from > period_to:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="period_from must be <= period_to",
            )

        lower_name = filename.lower()
        if not any(lower_name.endswith(ext) for ext in ALLOWED_EXTENSIONS):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Only .xls and .xlsx files are supported",
            )
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Empty file",
            )

        safe_name = self.s3_client.sanitize_key_segment(filename, "timesheet")
        key = f"timesheets/{datetime.now().strftime('%Y%m%d%H%M%S')}_{safe_name}"
        await self.s3_client.put_object(
            key=key,
            body=payload,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            metadata={"location_id": str(location_id) if location_id is not None else ""},
        )

        upload = TimesheetUploadModel(
            file_name=filename,
            s3_file_key=key,
            period_from=period_from,
            period_to=period_to,
            status=TimesheetUploadStatus.UPLOADED.value,
            rows_count=0,
        )
        self.session.add(upload)
        await self.session.commit()
        await self.session.refresh(upload)

        return TimesheetUploadResultDTO(
            upload_id=upload.id,
            status=upload.status,
            rows_count=upload.rows_count,
            errors=[],
        )
