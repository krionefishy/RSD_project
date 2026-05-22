from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from storage.pg.database import Base

if TYPE_CHECKING:
    from app.locations.db_models import BlockModel, LocationModel
    from app.users.db_models import UserModel


class RatingSnapshotModel(Base):
    __tablename__ = "rating_snapshots"

    __table_args__ = (
        Index("ix_rating_snapshots_type_scope", "rating_type", "scope_type", "scope_id"),
        Index("ix_rating_snapshots_period", "period_type", "period_from", "period_to"),
        Index("ix_rating_snapshots_metric_code", "metric_code"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    rating_type: Mapped[str] = mapped_column(String(20), nullable=False)
    scope_type: Mapped[str] = mapped_column(String(20), nullable=False)
    scope_id: Mapped[int | None] = mapped_column(Integer)
    period_type: Mapped[str] = mapped_column(String(20), nullable=False)
    period_from: Mapped[date] = mapped_column(Date, nullable=False)
    period_to: Mapped[date] = mapped_column(Date, nullable=False)
    metric_code: Mapped[str] = mapped_column(String(50), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())

    items: Mapped[list["RatingSnapshotItemModel"]] = relationship(
        "RatingSnapshotItemModel",
        back_populates="snapshot",
        cascade="all, delete-orphan",
        order_by="RatingSnapshotItemModel.rank",
    )


class RatingSnapshotItemModel(Base):
    __tablename__ = "rating_snapshot_items"

    __table_args__ = (
        UniqueConstraint("snapshot_id", "user_id", name="uq_rating_snapshot_items_snapshot_user"),
        Index("ix_rating_snapshot_items_snapshot_rank", "snapshot_id", "rank"),
        Index("ix_rating_snapshot_items_user_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("rating_snapshots.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    metric_value: Mapped[Decimal] = mapped_column(Numeric(14, 3), nullable=False)
    metric_display: Mapped[str] = mapped_column(String(100), nullable=False)
    secondary_value: Mapped[Decimal | None] = mapped_column(Numeric(14, 3))
    secondary_display: Mapped[str | None] = mapped_column(String(100))
    location_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("locations.id", ondelete="SET NULL"),
    )
    block_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("blocks.id", ondelete="SET NULL"),
    )

    snapshot: Mapped["RatingSnapshotModel"] = relationship("RatingSnapshotModel", back_populates="items")
    user: Mapped["UserModel"] = relationship("UserModel", back_populates="rating_snapshot_items")
    location: Mapped["LocationModel | None"] = relationship("LocationModel", back_populates="rating_snapshot_items")
    block: Mapped["BlockModel | None"] = relationship("BlockModel", back_populates="rating_snapshot_items")


class ReportExportModel(Base):
    __tablename__ = "report_exports"

    __table_args__ = (
        Index("ix_report_exports_requested_by", "requested_by"),
        Index("ix_report_exports_scope", "scope_type", "scope_id"),
        Index("ix_report_exports_status", "status"),
        Index("ix_report_exports_period", "period_from", "period_to"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    requested_by: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    scope_type: Mapped[str] = mapped_column(String(20), nullable=False)
    scope_id: Mapped[str | None] = mapped_column(String(100))
    period_from: Mapped[date] = mapped_column(Date, nullable=False)
    period_to: Mapped[date] = mapped_column(Date, nullable=False)
    format: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    s3_file_key: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    requested_by_user: Mapped["UserModel"] = relationship("UserModel", back_populates="report_exports")
