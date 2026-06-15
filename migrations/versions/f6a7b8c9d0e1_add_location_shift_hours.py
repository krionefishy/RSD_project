"""add location shift hours

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-15
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: str | None = "e5f6a7b8c9d0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "locations",
        sa.Column("s1_start_at", sa.Time(), nullable=False, server_default="08:00"),
    )
    op.add_column(
        "locations",
        sa.Column("s1_end_at", sa.Time(), nullable=False, server_default="16:00"),
    )
    op.add_column(
        "locations",
        sa.Column("s2_start_at", sa.Time(), nullable=False, server_default="16:00"),
    )
    op.add_column(
        "locations",
        sa.Column("s2_end_at", sa.Time(), nullable=False, server_default="00:00"),
    )
    op.alter_column("locations", "s1_start_at", server_default=None)
    op.alter_column("locations", "s1_end_at", server_default=None)
    op.alter_column("locations", "s2_start_at", server_default=None)
    op.alter_column("locations", "s2_end_at", server_default=None)


def downgrade() -> None:
    op.drop_column("locations", "s2_end_at")
    op.drop_column("locations", "s2_start_at")
    op.drop_column("locations", "s1_end_at")
    op.drop_column("locations", "s1_start_at")
