"""create report jobs

Revision ID: 0001_report_jobs
Revises:
Create Date: 2026-06-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_report_jobs"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "report_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_type", sa.String(length=50), nullable=False),
        sa.Column("source_filename", sa.String(length=255), nullable=True),
        sa.Column("file_extension", sa.String(length=20), nullable=True),
        sa.Column("content_type", sa.String(length=255), nullable=True),
        sa.Column("parse_status", sa.String(length=20), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("s3_file_key", sa.String(length=500), nullable=True),
        sa.Column("params", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint(
            "parse_status IN ('pending', 'processing', 'completed', 'failed')",
            name="ck_report_jobs_parse_status_valid",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_report_jobs_report_type", "report_jobs", ["report_type"], unique=False)
    op.create_index("ix_report_jobs_parse_status", "report_jobs", ["parse_status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_report_jobs_parse_status", table_name="report_jobs")
    op.drop_index("ix_report_jobs_report_type", table_name="report_jobs")
    op.drop_table("report_jobs")
