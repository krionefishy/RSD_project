"""create incoming sales

Revision ID: 0001_incoming_sales
Revises:
Create Date: 2026-06-12
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_incoming_sales"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "incoming_sales",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cashbox_id", sa.String(length=100), nullable=False),
        sa.Column("external_sale_id", sa.String(length=120), nullable=False),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("received_at", sa.DateTime(), nullable=False),
        sa.Column("total_amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("error_message", sa.String(length=1000), nullable=True),
        sa.CheckConstraint(
            "status IN ('received', 'queued', 'published', 'failed', 'duplicate')",
            name="ck_incoming_sales_status_valid",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cashbox_id", "external_sale_id", name="uq_incoming_sales_cashbox_external"),
    )
    op.create_index("ix_incoming_sales_cashbox_id", "incoming_sales", ["cashbox_id"], unique=False)
    op.create_index("ix_incoming_sales_occurred_at", "incoming_sales", ["occurred_at"], unique=False)
    op.create_index("ix_incoming_sales_status", "incoming_sales", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_incoming_sales_status", table_name="incoming_sales")
    op.drop_index("ix_incoming_sales_occurred_at", table_name="incoming_sales")
    op.drop_index("ix_incoming_sales_cashbox_id", table_name="incoming_sales")
    op.drop_table("incoming_sales")
