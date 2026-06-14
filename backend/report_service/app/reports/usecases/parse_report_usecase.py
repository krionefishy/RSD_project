import asyncio
from datetime import datetime
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.reports.db_models import ParseStatus, ReportJobModel
from app.reports.dto import ParsedReportDTO
from app.reports.parser import parse_report_payload


class ParseReportUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, filename: str, content: bytes) -> ParsedReportDTO:
        parsed = await asyncio.to_thread(parse_report_payload, filename, content)
        job_id = uuid4()
        uploaded_at = datetime.now()

        job = ReportJobModel(
            id=job_id,
            report_type="unknown",
            source_filename=parsed.filename,
            file_extension=self._extension(parsed.filename),
            content_type="application/octet-stream",
            parse_status=ParseStatus.COMPLETED.value,
            size_bytes=parsed.size_bytes,
            params={"parser": "stub"},
            uploaded_at=uploaded_at,
            completed_at=uploaded_at,
        )
        self.session.add(job)
        await self.session.commit()

        return ParsedReportDTO(
            id=job_id,
            filename=parsed.filename,
            parse_status=job.parse_status,
            size_bytes=parsed.size_bytes,
            uploaded_at=uploaded_at,
            message="Report parser stub accepted the file; concrete format parsing is not implemented yet.",
        )

    def _extension(self, filename: str) -> str:
        return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
