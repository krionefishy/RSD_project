"""add max_attempts to tests

Revision ID: b1c2d3e4f5a6
Revises: f6a7b8c9d0e1
Create Date: 2026-06-16

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b1c2d3e4f5a6"
down_revision: str | None = "f6a7b8c9d0e1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tests",
        sa.Column("max_attempts", sa.Integer(), nullable=True),
    )
    op.create_check_constraint(
        "ck_tests_max_attempts_positive",
        "tests",
        "max_attempts IS NULL OR max_attempts > 0",
    )


def downgrade() -> None:
    op.drop_constraint("ck_tests_max_attempts_positive", "tests", type_="check")
    op.drop_column("tests", "max_attempts")
