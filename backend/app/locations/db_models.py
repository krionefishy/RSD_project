from enum import Enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from storage.pg.database import Base

if TYPE_CHECKING:
    from app.users.db_models import UserModel


class BlockMemberStatus(str, Enum):
    PRIMARY = "primary"
    RESERVE = "reserve"


class BlockModel(Base):
    __tablename__ = "blocks"

    __table_args__ = (
        UniqueConstraint("name", name="uq_blocks_name"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    manager_assignments: Mapped[list["ManagerBlockModel"]] = relationship(
        "ManagerBlockModel",
        back_populates="block",
        cascade="all, delete-orphan"
    )
    location_assignments: Mapped[list["BlockLocationModel"]] = relationship(
        "BlockLocationModel",
        back_populates="block",
        cascade="all, delete-orphan"
    )
    member_assignments: Mapped[list["BlockMemberModel"]] = relationship(
        "BlockMemberModel",
        back_populates="block",
        cascade="all, delete-orphan"
    )

    @property
    def locations(self) -> list["LocationModel"]:
        return [la.location for la in self.location_assignments if la.location]

    @property
    def members(self) -> list["BlockMemberModel"]:
        return self.member_assignments


class ManagerBlockModel(Base):
    __tablename__ = "manager_blocks"

    __table_args__ = (
        UniqueConstraint("manager_id", name="uq_manager_blocks_manager"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    manager_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    block_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("blocks.id", ondelete="CASCADE"),
        nullable=False,
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())

    manager: Mapped["UserModel"] = relationship("UserModel", back_populates="block_assignments")
    block: Mapped["BlockModel"] = relationship("BlockModel", back_populates="manager_assignments")

    @property
    def block_name(self) -> str | None:
        return self.block.name if self.block else None


class BlockMemberModel(Base):
    __tablename__ = "block_members"

    __table_args__ = (
        UniqueConstraint("user_id", name="uq_block_members_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    block_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("blocks.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=BlockMemberStatus.PRIMARY.value,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
    )

    user: Mapped["UserModel"] = relationship("UserModel", back_populates="block_memberships")
    block: Mapped["BlockModel"] = relationship("BlockModel", back_populates="member_assignments")


class BlockLocationModel(Base):
    __tablename__ = "block_locations"

    __table_args__ = (
        UniqueConstraint("block_id", "location_id", name="uq_block_locations_block_location"),
        Index("ix_block_locations_location_id", "location_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    block_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("blocks.id", ondelete="CASCADE"),
        nullable=False,
    )
    location_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("locations.id", ondelete="CASCADE"),
        nullable=False,
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())

    block: Mapped["BlockModel"] = relationship("BlockModel", back_populates="location_assignments")
    location: Mapped["LocationModel"] = relationship("LocationModel", back_populates="block_assignments")


class LocationModel(Base):
    __tablename__ = "locations"

    __table_args__ = (
        UniqueConstraint("name", "address", name="uq_locations_name_address"),
        Index("ix_locations_code", "code"),
        Index("ix_locations_name_address", "name", "address"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    city: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    block_assignments: Mapped[list["BlockLocationModel"]] = relationship(
        "BlockLocationModel",
        back_populates="location",
        cascade="all, delete-orphan"
    )
    user_assignments: Mapped[list["UserLocationModel"]] = relationship(
        "UserLocationModel",
        back_populates="location",
        cascade="all, delete-orphan"
    )

    @property
    def blocks(self) -> list["BlockModel"]:
        return [ba.block for ba in self.block_assignments if ba.block]

    @property
    def assigned_users(self) -> list["UserModel"]:
        return [ua.user for ua in self.user_assignments if ua.user]


class UserLocationModel(Base):
    __tablename__ = "user_locations"

    __table_args__ = (
        UniqueConstraint("user_id", "location_id", name="uq_user_locations_user_location"),
        Index("ix_user_locations_location_user", "location_id", "user_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    location_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("locations.id", ondelete="CASCADE"),
        nullable=False,
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())

    user: Mapped["UserModel"] = relationship("UserModel", foreign_keys=[user_id], back_populates="location_assignments")
    location: Mapped["LocationModel"] = relationship("LocationModel", back_populates="user_assignments")
