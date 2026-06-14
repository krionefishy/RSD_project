from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from storage.pg.database import Base


class IncomingSaleModel(Base):
    __tablename__ = "incoming_sales"

    __table_args__ = (
        UniqueConstraint("cashbox_id", "external_sale_id", name="uq_incoming_sales_cashbox_external"),
        Index("ix_incoming_sales_status", "status"),
        Index("ix_incoming_sales_cashbox_id", "cashbox_id"),
        Index("ix_incoming_sales_occurred_at", "occurred_at"),
        CheckConstraint(
            "status IN ('received', 'queued', 'published', 'failed', 'duplicate')",
            name="ck_incoming_sales_status_valid",
        ),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    cashbox_id: Mapped[str] = mapped_column(String(100), nullable=False)
    external_sale_id: Mapped[str] = mapped_column(String(120), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="RUB")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="received")
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    error_message: Mapped[str | None] = mapped_column(String(1000))
