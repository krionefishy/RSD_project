from dataclasses import dataclass
from uuid import UUID

from shared.integrations.report_service.client import ReportServiceClient
from storage.s3.client import S3Client


@dataclass
class ReportExportStatusDTO:
    job_id: UUID
    parse_status: str
    report_type: str
    presigned_url: str | None = None


class GetReportExportUseCase:
    def __init__(
        self,
        report_service_client: ReportServiceClient,
        s3_client: S3Client,
    ):
        self._client = report_service_client
        self._s3 = s3_client

    async def execute(self, job_id: UUID) -> ReportExportStatusDTO:
        job = await self._client.get_report_job(job_id)

        presigned_url: str | None = None
        if job.get("parse_status") == "completed" and job.get("s3_file_key"):
            if self._s3 is not None:
                presigned_url = self._s3.generate_presigned_url(
                    key=job["s3_file_key"],
                    expiration=3600,
                    response_content_type=(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    ),
                    response_disposition=f'attachment; filename="{job.get("report_type", "report")}.xlsx"',
                )

        return ReportExportStatusDTO(
            job_id=UUID(job["job_id"]),
            parse_status=job.get("parse_status", "unknown"),
            report_type=job.get("report_type", ""),
            presigned_url=presigned_url,
        )
