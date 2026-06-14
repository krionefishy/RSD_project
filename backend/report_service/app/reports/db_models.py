from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from storage.pg.database import Base


class ParseStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ReportJobModel(Base):
    __tablename__ = "report_jobs"

    __table_args__ = (
        Index("ix_report_jobs_parse_status", "parse_status"),
        Index("ix_report_jobs_report_type", "report_type"),
        CheckConstraint(
            "parse_status IN ('pending', 'processing', 'completed', 'failed')",
            name="ck_report_jobs_parse_status_valid",
        ),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_filename: Mapped[str | None] = mapped_column(String(255))
    file_extension: Mapped[str | None] = mapped_column(String(20))
    content_type: Mapped[str | None] = mapped_column(String(255))
    parse_status: Mapped[str] = mapped_column(String(20), nullable=False, default=ParseStatus.PENDING.value)
    size_bytes: Mapped[int | None] = mapped_column(Integer)
    s3_file_key: Mapped[str | None] = mapped_column(String(500))
    params: Mapped[dict | None] = mapped_column(JSONB)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
