"""remove timesheet uploads and temp password flag from main database

Revision ID: e5f6a7b8c9d0
Revises: d4a5b6c7d8e9
Create Date: 2026-06-14
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: str | None = "d4a5b6c7d8e9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    time_entry_columns = {column["name"] for column in inspector.get_columns("employee_time_entries")}
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    table_names = set(inspector.get_table_names())

    if "timesheet_upload_id" in time_entry_columns:
        op.drop_index("ix_employee_time_entries_upload_id", table_name="employee_time_entries")
        op.drop_constraint(
            "employee_time_entries_timesheet_upload_id_fkey",
            "employee_time_entries",
            type_="foreignkey",
        )
        op.drop_column("employee_time_entries", "timesheet_upload_id")
    if "comment" in time_entry_columns:
        op.drop_column("employee_time_entries", "comment")
    if "is_temp_password" in user_columns:
        op.drop_column("users", "is_temp_password")
    if "timesheet_uploads" in table_names:
        op.drop_index("ix_timesheet_uploads_status", table_name="timesheet_uploads")
        op.drop_index("ix_timesheet_uploads_period", table_name="timesheet_uploads")
        op.drop_table("timesheet_uploads")


def downgrade() -> None:
    op.create_table(
        "timesheet_uploads",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("s3_file_key", sa.String(length=500), nullable=False),
        sa.Column("period_from", sa.Date(), nullable=False),
        sa.Column("period_to", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("rows_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_timesheet_uploads_status", "timesheet_uploads", ["status"], unique=False)
    op.create_index(
        "ix_timesheet_uploads_period",
        "timesheet_uploads",
        ["period_from", "period_to"],
        unique=False,
    )
    op.add_column("users", sa.Column("is_temp_password", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.alter_column("users", "is_temp_password", server_default=None)
    op.add_column("employee_time_entries", sa.Column("comment", sa.String(length=500), nullable=True))
    op.add_column("employee_time_entries", sa.Column("timesheet_upload_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "employee_time_entries_timesheet_upload_id_fkey",
        "employee_time_entries",
        "timesheet_uploads",
        ["timesheet_upload_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_employee_time_entries_upload_id",
        "employee_time_entries",
        ["timesheet_upload_id"],
        unique=False,
    )
