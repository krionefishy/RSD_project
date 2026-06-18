from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from storage.pg.database import Base


class CourseModel(Base):
    __tablename__ = "courses"

    __table_args__ = (
        CheckConstraint("rating_points >= 0", name="ck_courses_rating_points_non_negative"),
        CheckConstraint("mrp >= 0", name="ck_courses_mrp_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    rating_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mrp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    course_materials = relationship("CourseMaterialModel", back_populates="course", cascade="all, delete-orphan")
    course_tests = relationship("CourseTestModel", back_populates="course", cascade="all, delete-orphan")
    user_course_materials = relationship("UserCourseMaterialModel", back_populates="course", cascade="all, delete-orphan")
    user_course_tests = relationship("UserCourseTestModel", back_populates="course", cascade="all, delete-orphan")

    @property
    def materials_count(self):
        return len(self.course_materials) if self.course_materials else 0

    @property
    def tests_count(self):
        return len(self.course_tests) if self.course_tests else 0


class CourseUserModel(Base):
    __tablename__ = "course_users"

    __table_args__ = (
        Index("ix_course_users_user_course", "user_id", "course_id", unique=True),
        Index("ix_course_users_course_user", "course_id", "user_id"),
        Index("ix_course_users_user_completed", "user_id", "is_course_completed_successfully"),
        CheckConstraint("user_points_by_course >= 0", name="ck_course_users_points_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_points_by_course: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_course_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_course_completed_successfully: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    user = relationship("UserModel", back_populates="course_users")
    course = relationship("CourseModel")

    @property
    def completion_percentage(self):
        if not self.course:
            return 0
        max_points = self.course.rating_points
        if max_points == 0:
            return 100 if self.is_course_completed else 0
        percentage = (self.user_points_by_course / max_points) * 100
        return min(percentage, 100)


class CourseMaterialModel(Base):
    __tablename__ = "course_materials"

    __table_args__ = (
        Index("ix_course_materials_course_material", "course_id", "material_id", unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    material_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    course = relationship("CourseModel", back_populates="course_materials")
    material = relationship("MaterialModel", back_populates="course_materials")


class CourseTestModel(Base):
    __tablename__ = "course_tests"

    __table_args__ = (
        Index("ix_course_tests_course_test", "course_id", "test_id", unique=True),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("tests.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_final: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    course = relationship("CourseModel", back_populates="course_tests")
    test = relationship("TestModel", back_populates="course_tests")


class UserCourseMaterialModel(Base):
    __tablename__ = "user_course_materials"

    __table_args__ = (
        Index("ix_user_course_materials_material_id", "material_id"),
        Index("ix_user_course_materials_user_completed", "user_id", "is_completed"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    material_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    user = relationship("UserModel", back_populates="user_course_materials")
    course = relationship("CourseModel", back_populates="user_course_materials")
    material = relationship("MaterialModel", back_populates="user_course_materials")


class UserCourseTestModel(Base):
    __tablename__ = "user_course_tests"

    __table_args__ = (
        Index("ix_user_course_tests_test_id", "test_id"),
        Index("ix_user_course_tests_user_course_test", "user_id", "course_id", "test_id", unique=True),
        CheckConstraint("attempt_number > 0", name="ck_user_course_tests_attempt_positive"),
        CheckConstraint("score IS NULL OR score >= 0", name="ck_user_course_tests_score_non_negative"),
        CheckConstraint("max_score IS NULL OR max_score >= 0", name="ck_user_course_tests_max_score_non_negative"),
        CheckConstraint(
            "score IS NULL OR max_score IS NULL OR score <= max_score",
            name="ck_user_course_tests_score_lte_max",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    test_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("tests.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer, default=None)
    max_score: Mapped[int | None] = mapped_column(Integer, default=None)
    is_passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    answers: Mapped[dict | None] = mapped_column(JSON, default=None)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    user = relationship("UserModel", back_populates="user_course_tests")
    course = relationship("CourseModel", back_populates="user_course_tests")
    test = relationship("TestModel", back_populates="user_course_tests")


class MaterialModel(Base):
    __tablename__ = "materials"

    __table_args__ = (
        Index("ix_materials_name_category", "name", "category"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    course_materials = relationship("CourseMaterialModel", back_populates="material", cascade="all, delete-orphan")
    attachments = relationship("MaterialAttachmentModel", back_populates="material", cascade="all, delete-orphan")
    user_course_materials = relationship("UserCourseMaterialModel", back_populates="material", cascade="all, delete-orphan")

    @property
    def attachment_files(self):
        if not self.attachments:
            return []
        return [att.s3_file_key for att in self.attachments]


class MaterialAttachmentModel(Base):
    __tablename__ = "material_attachments"

    __table_args__ = (
        Index("ix_material_attachments_material_id", "material_id"),
        Index("ix_material_attachments_s3_file_key", "s3_file_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    material_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    format: Mapped[str] = mapped_column(String(50), nullable=False)
    s3_file_key: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    material = relationship("MaterialModel", back_populates="attachments")

    @property
    def full_filename(self):
        return f"{self.name}.{self.format.lower()}" if self.format else self.name

    @staticmethod
    def generate_s3_key(material_id, filename, file_format):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_ext = file_format.lower() if file_format else "bin"
        return f"materials/{material_id}/{timestamp}_{filename}.{file_ext}"


class TestModel(Base):
    __tablename__ = "tests"

    __table_args__ = (
        Index("ix_tests_is_final", "is_final"),
        Index("ix_tests_name_category", "name", "category"),
        CheckConstraint(
            "time_limit_minutes IS NULL OR time_limit_minutes > 0",
            name="ck_tests_time_limit_positive",
        ),
        CheckConstraint("pass_score_percent BETWEEN 0 AND 100", name="ck_tests_pass_score_percent_valid"),
        CheckConstraint(
            "max_attempts IS NULL OR max_attempts > 0",
            name="ck_tests_max_attempts_positive",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    time_limit_minutes: Mapped[int | None] = mapped_column(Integer)
    max_attempts: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pass_score_percent: Mapped[int] = mapped_column(Integer, default=70, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    task_assignments: Mapped[list["TestTaskAssignmentModel"]] = relationship(
        "TestTaskAssignmentModel",
        back_populates="test",
        cascade="all, delete-orphan",
        order_by="TestTaskAssignmentModel.order"
    )
    course_tests = relationship("CourseTestModel", back_populates="test", cascade="all, delete-orphan")
    user_course_tests = relationship("UserCourseTestModel", back_populates="test", cascade="all, delete-orphan")

    @property
    def tasks_ordered(self) -> list["TestTaskModel"]:
        return [ta.task for ta in self.task_assignments if ta.task]

    @property
    def tasks_count(self) -> int:
        return len(self.task_assignments) if self.task_assignments else 0

    @property
    def total_points(self) -> int:
        if not self.task_assignments:
            return 0
        return sum(ta.task.points for ta in self.task_assignments if ta.task)


class TestTaskModel(Base):
    __tablename__ = "test_tasks"

    __table_args__ = (
        CheckConstraint("points > 0", name="ck_test_tasks_points_positive"),
        CheckConstraint("correct_variant >= 0", name="ck_test_tasks_correct_variant_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    answer_variants: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    correct_variant: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now()
    )

    test_assignments: Mapped[list["TestTaskAssignmentModel"]] = relationship(
        "TestTaskAssignmentModel",
        back_populates="task",
        cascade="all, delete-orphan"
    )


class TestTaskAssignmentModel(Base):
    __tablename__ = "test_task_assignments"

    __table_args__ = (
        Index("ix_test_task_assignments_test_order", "test_id", "order"),
        Index("ix_test_task_assignments_task_id", "task_id"),
        CheckConstraint("\"order\" >= 0", name="ck_test_task_assignments_order_non_negative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    test_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("tests.id", ondelete="CASCADE"),
        nullable=False,
    )
    task_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("test_tasks.id", ondelete="CASCADE"),
        nullable=False,
    )
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now())

    test: Mapped["TestModel"] = relationship("TestModel", back_populates="task_assignments")
    task: Mapped["TestTaskModel"] = relationship("TestTaskModel", back_populates="test_assignments")
