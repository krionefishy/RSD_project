import asyncio
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from shared.kafka_streams.producer import KafkaProducerWrapper
from shared.kafka_streams.storage_events import publish_s3_upload
from shared.kafka_streams.topics import StorageTopics
from sqlalchemy.ext.asyncio import AsyncSession

from app.reports.db_models import ParseStatus, ReportJobModel
from app.reports.dto import ParsedTimesheetScheduleDTO
from app.reports.timesheet_schedule_parser import (
    TimesheetScheduleParserError,
    parse_timesheet_schedule_payload,
)

REPORT_TYPE = "timesheet_schedule"


class ParseTimesheetScheduleUseCase:
    def __init__(self, session: AsyncSession, kafka_producer: KafkaProducerWrapper):
        self.session = session
        self.kafka_producer = kafka_producer

    async def execute(
        self,
        filename: str,
        content: bytes,
        point_identifier: str,
        point_name: str,
        period_from: str | None = None,
        period_to: str | None = None,
    ) -> ParsedTimesheetScheduleDTO:
        if not filename.lower().endswith(".xlsx"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Only .xlsx files are supported",
            )
        if not content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Empty file",
            )

        job_id = uuid4()
        uploaded_at = datetime.now()
        s3_file_key = self._build_s3_key(job_id, filename)
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        job = ReportJobModel(
            id=job_id,
            report_type=REPORT_TYPE,
            source_filename=filename,
            file_extension=self._extension(filename),
            content_type=content_type,
            parse_status=ParseStatus.PROCESSING.value,
            size_bytes=len(content),
            s3_file_key=s3_file_key,
            params={
                "point_identifier": point_identifier,
                "point_name": point_name,
                "period_from": period_from,
                "period_to": period_to,
            },
            uploaded_at=uploaded_at,
        )
        self.session.add(job)
        await self.session.flush()

        await publish_s3_upload(
            self.kafka_producer,
            StorageTopics.TIMESHEET_SCHEDULE_UPLOAD,
            key=s3_file_key,
            body=content,
            content_type=content_type,
            metadata={
                "job_id": str(job_id),
                "report_type": REPORT_TYPE,
                "point_identifier": point_identifier,
            },
            original_filename=filename,
        )

        try:
            parsed = await asyncio.to_thread(
                parse_timesheet_schedule_payload,
                filename,
                content,
            )
        except TimesheetScheduleParserError as exc:
            job.parse_status = ParseStatus.FAILED.value
            job.completed_at = datetime.now()
            await self.session.commit()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        completed_at = datetime.now()
        if parsed.errors:
            job.parse_status = ParseStatus.FAILED.value
            job.completed_at = completed_at
            await self.session.commit()
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=[error.model_dump() for error in parsed.errors],
            )

        job.parse_status = ParseStatus.COMPLETED.value
        job.completed_at = completed_at
        job.params = {
            **(job.params or {}),
            "parsed_point_identifier": parsed.point_identifier,
            "parsed_point_name": parsed.point_name,
            "entries_count": len(parsed.entries),
            "errors_count": len(parsed.errors),
        }
        await self.session.commit()

        return ParsedTimesheetScheduleDTO(
            id=job_id,
            filename=parsed.filename,
            file_extension=job.file_extension or "",
            content_type=job.content_type or content_type,
            parse_status=job.parse_status,
            size_bytes=parsed.size_bytes,
            s3_file_key=s3_file_key,
            point_identifier=parsed.point_identifier or point_identifier,
            point_name=parsed.point_name or point_name,
            period=parsed.period,
            shifts=parsed.shifts,
            entries_count=len(parsed.entries),
            entries=[entry.model_dump() for entry in parsed.entries],
            uploaded_at=uploaded_at,
            completed_at=completed_at,
        )

    def _build_s3_key(self, job_id: UUID, filename: str) -> str:
        safe_name = "".join(ch if ch.isalnum() or ch in {"-", "_", "."} else "_" for ch in filename)
        safe_name = safe_name.strip("._-") or "timesheet_schedule.xlsx"
        return f"report-service/timesheet-schedules/{job_id}_{safe_name}"

    def _extension(self, filename: str) -> str:
        return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
