from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import String, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from storage.pg.database import Base

if TYPE_CHECKING:
    from app.knowledge_base.db_models import CourseUserModel, UserCourseMaterialModel, UserCourseTestModel, CourseModel, MaterialModel
    from app.locations.db_models import UserLocationModel, LocationModel, ManagerBlockModel, BlockModel


class UserRole(str, Enum):
    """Роли пользователей в системе RSD.

    Соответствует спецификации ROLE_MODEL.md
    """
    SUPER_ADMIN = "super_admin"
    ROOT_ADMIN = "root_admin"
    ADMIN_STAFF = "admin_staff"
    ADMIN_EDUCATION = "admin_education"
    ADMIN_SALES = "admin_sales"
    MANAGER = "manager"
    SELLER = "seller"


class UserModel(Base):
    __tablename__ = "users"

    __table_args__ = (
        Index("ix_users_email", "email"),
    )

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(String(50), nullable=False, default=UserRole.SELLER)
    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    course_users: Mapped[list["CourseUserModel"]] = relationship(
        "CourseUserModel",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    user_course_materials: Mapped[list["UserCourseMaterialModel"]] = relationship(
        "UserCourseMaterialModel",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    user_course_tests: Mapped[list["UserCourseTestModel"]] = relationship(
        "UserCourseTestModel",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    location_assignments: Mapped[list["UserLocationModel"]] = relationship(
        "UserLocationModel",
        foreign_keys="UserLocationModel.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    block_assignments: Mapped[list["ManagerBlockModel"]] = relationship(
        "ManagerBlockModel",
        back_populates="manager",
        cascade="all, delete-orphan"
    )

    @property
    def courses(self) -> list["CourseModel"]:
        if not self.course_users:
            return []
        return [cu.course for cu in self.course_users if cu.course]

    @property
    def completed_materials(self) -> list["MaterialModel"]:
        if not self.user_course_materials:
            return []
        return [
            um.material for um in self.user_course_materials
            if um.is_completed and um.material
        ]

    @property
    def completed_tests(self) -> list["UserCourseTestModel"]:
        if not self.user_course_tests:
            return []
        return self.user_course_tests

    @property
    def location(self) -> "LocationModel | None":
        if not self.location_assignments:
            return None
        return self.location_assignments[0].location if self.location_assignments[0].location else None

    @property
    def managed_block(self) -> "BlockModel | None":
        if self.role != UserRole.MANAGER:
            return None
        if not self.block_assignments:
            return None
        return self.block_assignments[0].block if self.block_assignments[0].block else None

    @property
    def full_name(self) -> str:
        parts = [p for p in [self.first_name, self.last_name] if p]
        return " ".join(parts) if parts else self.email
