"""add seller_role to users

Revision ID: b8f3c2a91d04
Revises: a021ca5c7e72
Create Date: 2026-05-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b8f3c2a91d04"
down_revision: Union[str, None] = "a021ca5c7e72"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("seller_role", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "seller_role")
