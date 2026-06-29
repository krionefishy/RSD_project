"""allow dual work shifts per day

Revision ID: h8c9d0e1f2a3
Revises: g7b8c9d0e1f2
Create Date: 2026-06-29
"""

from collections.abc import Sequence

from alembic import op

revision: str = "h8c9d0e1f2a3"
down_revision: str | None = "g7b8c9d0e1f2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "uq_employee_time_entries_user_date_shift",
        "employee_time_entries",
        type_="unique",
    )
    op.create_index(
        "uq_employee_time_entries_user_date_shift_code",
        "employee_time_entries",
        ["user_id", "work_date", "shift_code"],
        unique=True,
        postgresql_where="shift_code IN ('С1', 'С2')",
    )
    op.create_index(
        "uq_employee_time_entries_user_date_non_work",
        "employee_time_entries",
        ["user_id", "work_date"],
        unique=True,
        postgresql_where="shift_type = 'none'",
    )


def downgrade() -> None:
    op.drop_index(
        "uq_employee_time_entries_user_date_non_work",
        table_name="employee_time_entries",
        postgresql_where="shift_type = 'none'",
    )
    op.drop_index(
        "uq_employee_time_entries_user_date_shift_code",
        table_name="employee_time_entries",
        postgresql_where="shift_code IN ('С1', 'С2')",
    )
    op.create_unique_constraint(
        "uq_employee_time_entries_user_date_shift",
        "employee_time_entries",
        ["user_id", "work_date", "shift_type"],
    )
