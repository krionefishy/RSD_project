"""add shift code to time entries

Revision ID: d4a5b6c7d8e9
Revises: c7e8f9a1b2d3
Create Date: 2026-06-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d4a5b6c7d8e9"
down_revision: str | None = "c7e8f9a1b2d3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("employee_time_entries", sa.Column("shift_code", sa.String(length=10), nullable=True))
    op.add_column("employee_time_entries", sa.Column("starts_at", sa.Time(), nullable=True))
    op.add_column("employee_time_entries", sa.Column("ends_at", sa.Time(), nullable=True))
    op.create_check_constraint(
        "ck_employee_time_entries_shift_code_valid",
        "employee_time_entries",
        "shift_code IS NULL OR shift_code IN ('С1', 'С2', 'В', 'О/Б')",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_employee_time_entries_shift_code_valid",
        "employee_time_entries",
        type_="check",
    )
    op.drop_column("employee_time_entries", "ends_at")
    op.drop_column("employee_time_entries", "starts_at")
    op.drop_column("employee_time_entries", "shift_code")
