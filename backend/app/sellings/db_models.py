from enum import Enum
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
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
    from app.locations.db_models import LocationModel
    from app.users.db_models import UserModel


class SalesImportStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSED = "processed"
    FAILED = "failed"


class SalesOperationType(str, Enum):
    SALE = "sale"
    RETURN = "return"
    CORRECTION = "correction"


class EmployeeSalesPlanModel(Base):
    __tablename__ = "employee_sales_plans"

    __table_args__ = (
        Index("ix_employee_sales_plans_user_period", "user_id", "date_from", "date_to"),
        Index("ix_employee_sales_plans_product_name", "product_name"),
        Index("ix_employee_sales_plans_is_active", "is_active"),
        CheckConstraint("date_from <= date_to", name="ck_employee_sales_plans_period_order"),
        CheckConstraint("target_quantity >= 0", name="ck_employee_sales_plans_target_quantity_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_from: Mapped[date] = mapped_column(Date, nullable=False)
    date_to: Mapped[date] = mapped_column(Date, nullable=False)
    target_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    user: Mapped["UserModel"] = relationship("UserModel", back_populates="employee_sales_plans")
    bonus_rules: Mapped[list["EmployeePlanBonusRuleModel"]] = relationship(
        "EmployeePlanBonusRuleModel",
        back_populates="employee_sales_plan",
        cascade="all, delete-orphan",
        order_by="EmployeePlanBonusRuleModel.from_quantity",
    )


class LocationSalesPlanModel(Base):
    __tablename__ = "location_sales_plans"

    __table_args__ = (
        Index("ix_location_sales_plans_location_plan_date", "location_id", "plan_date"),
        Index("ix_location_sales_plans_product_name", "product_name"),
        Index("ix_location_sales_plans_is_active", "is_active"),
        CheckConstraint("target_quantity >= 0", name="ck_location_sales_plans_target_quantity_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    location_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("locations.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_date: Mapped[date] = mapped_column(Date, nullable=False)
    target_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    location: Mapped["LocationModel"] = relationship("LocationModel", back_populates="sales_plans")


class EmployeePlanBonusRuleModel(Base):
    __tablename__ = "employee_plan_bonus_rules"

    __table_args__ = (
        Index("ix_employee_plan_bonus_rules_plan_from", "employee_sales_plan_id", "from_quantity"),
        CheckConstraint("from_quantity >= 0", name="ck_employee_plan_bonus_rules_from_non_negative"),
        CheckConstraint(
            "to_quantity IS NULL OR to_quantity > from_quantity",
            name="ck_employee_plan_bonus_rules_to_gt_from",
        ),
        CheckConstraint("bonus_per_unit >= 0", name="ck_employee_plan_bonus_rules_bonus_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_sales_plan_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("employee_sales_plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    from_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    to_quantity: Mapped[Decimal | None] = mapped_column(Numeric(10, 3))
    bonus_per_unit: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    employee_sales_plan: Mapped["EmployeeSalesPlanModel"] = relationship(
        "EmployeeSalesPlanModel",
        back_populates="bonus_rules",
    )


class SalesImportBatchModel(Base):
    __tablename__ = "sales_import_batches"

    __table_args__ = (
        Index("ix_sales_import_batches_status", "status"),
        Index("ix_sales_import_batches_period", "period_from", "period_to"),
        CheckConstraint("status IN ('uploaded', 'processed', 'failed')", name="ck_sales_import_batches_status_valid"),
        CheckConstraint(
            "period_from IS NULL OR period_to IS NULL OR period_from <= period_to",
            name="ck_sales_import_batches_period_order",
        ),
        CheckConstraint("receipts_count >= 0", name="ck_sales_import_batches_receipts_count_non_negative"),
        CheckConstraint("lines_count >= 0", name="ck_sales_import_batches_lines_count_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_system: Mapped[str] = mapped_column(String(50), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255))
    s3_file_key: Mapped[str | None] = mapped_column(String(500))
    period_from: Mapped[datetime | None] = mapped_column(DateTime)
    period_to: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=SalesImportStatus.UPLOADED.value)
    receipts_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lines_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    processed_at: Mapped[datetime | None] = mapped_column(DateTime)

    receipts: Mapped[list["SalesReceiptModel"]] = relationship(
        "SalesReceiptModel",
        back_populates="import_batch",
    )


class SalesReceiptModel(Base):
    __tablename__ = "sales_receipts"

    __table_args__ = (
        UniqueConstraint("source_system", "external_receipt_id", name="uq_sales_receipts_source_external"),
        Index("ix_sales_receipts_location_sold_at", "location_id", "sold_at"),
        Index("ix_sales_receipts_user_sold_at", "user_id", "sold_at"),
        CheckConstraint("operation_type IN ('sale', 'return', 'correction')", name="ck_sales_receipts_operation_type_valid"),
        CheckConstraint("total_amount >= 0", name="ck_sales_receipts_total_amount_non_negative"),
        CheckConstraint("total_discount >= 0", name="ck_sales_receipts_total_discount_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    import_batch_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("sales_import_batches.id", ondelete="SET NULL"),
    )
    source_system: Mapped[str] = mapped_column(String(50), nullable=False)
    external_receipt_id: Mapped[str] = mapped_column(String(255), nullable=False)
    receipt_number: Mapped[str | None] = mapped_column(String(100))
    location_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("locations.id", ondelete="SET NULL"),
    )
    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    sold_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    operation_type: Mapped[str] = mapped_column(String(20), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_discount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    import_batch: Mapped["SalesImportBatchModel | None"] = relationship("SalesImportBatchModel", back_populates="receipts")
    location: Mapped["LocationModel | None"] = relationship("LocationModel", back_populates="sales_receipts")
    user: Mapped["UserModel | None"] = relationship("UserModel", back_populates="sales_receipts")
    facts: Mapped[list["SalesFactModel"]] = relationship(
        "SalesFactModel",
        back_populates="receipt",
        cascade="all, delete-orphan",
    )


class SalesFactModel(Base):
    __tablename__ = "sales_facts"

    __table_args__ = (
        Index("ix_sales_facts_receipt_id", "receipt_id"),
        Index("ix_sales_facts_user_sale_datetime", "user_id", "sale_datetime"),
        Index("ix_sales_facts_location_sale_datetime", "location_id", "sale_datetime"),
        Index("ix_sales_facts_product_name", "product_name"),
        CheckConstraint("operation_type IN ('sale', 'return', 'correction')", name="ck_sales_facts_operation_type_valid"),
        CheckConstraint("quantity >= 0", name="ck_sales_facts_quantity_non_negative"),
        CheckConstraint("gross_amount >= 0", name="ck_sales_facts_gross_amount_non_negative"),
        CheckConstraint("discount_amount >= 0", name="ck_sales_facts_discount_amount_non_negative"),
        CheckConstraint("net_amount >= 0", name="ck_sales_facts_net_amount_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    receipt_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("sales_receipts.id", ondelete="CASCADE"),
        nullable=False,
    )
    external_line_id: Mapped[str | None] = mapped_column(String(255))
    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    location_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("locations.id", ondelete="SET NULL"),
    )
    product_external_id: Mapped[str | None] = mapped_column(String(255))
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_category: Mapped[str | None] = mapped_column(String(255))
    sale_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    operation_type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    net_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    receipt: Mapped["SalesReceiptModel"] = relationship("SalesReceiptModel", back_populates="facts")
    user: Mapped["UserModel | None"] = relationship("UserModel", back_populates="sales_facts")
    location: Mapped["LocationModel | None"] = relationship("LocationModel", back_populates="sales_facts")


class EmployeeDailySalesAggregateModel(Base):
    __tablename__ = "employee_daily_sales_aggregates"

    __table_args__ = (
        UniqueConstraint("user_id", "sales_date", "product_name", name="uq_employee_daily_sales_aggregates_user_date_product"),
        Index("ix_employee_daily_sales_aggregates_sales_date", "sales_date"),
        CheckConstraint("quantity >= 0", name="ck_employee_daily_sales_aggregates_quantity_non_negative"),
        CheckConstraint("net_amount >= 0", name="ck_employee_daily_sales_aggregates_net_amount_non_negative"),
        CheckConstraint("receipts_count >= 0", name="ck_employee_daily_sales_aggregates_receipts_count_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    sales_date: Mapped[date] = mapped_column(Date, nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False, default=0)
    net_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    receipts_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    user: Mapped["UserModel"] = relationship("UserModel", back_populates="employee_daily_sales_aggregates")


class LocationDailySalesAggregateModel(Base):
    __tablename__ = "location_daily_sales_aggregates"

    __table_args__ = (
        UniqueConstraint("location_id", "sales_date", "product_name", name="uq_location_daily_sales_aggregates_location_date_product"),
        Index("ix_location_daily_sales_aggregates_sales_date", "sales_date"),
        CheckConstraint("quantity >= 0", name="ck_location_daily_sales_aggregates_quantity_non_negative"),
        CheckConstraint("net_amount >= 0", name="ck_location_daily_sales_aggregates_net_amount_non_negative"),
        CheckConstraint("receipts_count >= 0", name="ck_location_daily_sales_aggregates_receipts_count_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    location_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("locations.id", ondelete="CASCADE"),
        nullable=False,
    )
    sales_date: Mapped[date] = mapped_column(Date, nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False, default=0)
    net_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    receipts_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    location: Mapped["LocationModel"] = relationship("LocationModel", back_populates="daily_sales_aggregates")
