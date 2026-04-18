from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from storage.pg.database import Base


class CourseModel(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    rating_points = Column(Integer, nullable=False, default=0)
    mrp = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_points_by_course = Column(Integer, nullable=False, default=0)
    is_course_completed = Column(Boolean, nullable=False, default=False)
    is_course_completed_successfully = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    material_id = Column(
        UUID(as_uuid=True),
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    course = relationship("CourseModel", back_populates="course_materials")
    material = relationship("MaterialModel", back_populates="course_materials")


class CourseTestModel(Base):
    __tablename__ = "course_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    test_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tests.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    course = relationship("CourseModel", back_populates="course_tests")
    test = relationship("TestModel", back_populates="course_tests")


class UserCourseMaterialModel(Base):
    __tablename__ = "user_course_materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    material_id = Column(
        UUID(as_uuid=True),
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    course = relationship("CourseModel", back_populates="user_course_materials")
    material = relationship("MaterialModel")


class UserCourseTestModel(Base):
    __tablename__ = "user_course_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    test_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tests.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id = Column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    course = relationship("CourseModel", back_populates="user_course_tests")
    test = relationship("TestModel", back_populates="user_course_tests")


class MaterialModel(Base):
    __tablename__ = "materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    course_materials = relationship("CourseMaterialModel", back_populates="material", cascade="all, delete-orphan")
    attachments = relationship("MaterialAttachmentModel", back_populates="material", cascade="all, delete-orphan")

    @property
    def attachment_files(self):
        if not self.attachments:
            return []
        return [att.s3_file_key for att in self.attachments]


class MaterialAttachmentModel(Base):
    __tablename__ = "material_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    material_id = Column(
        UUID(as_uuid=True),
        ForeignKey("materials.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    format = Column(String(50), nullable=False)
    s3_file_key = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    material = relationship("MaterialModel", back_populates="attachments")

    @property
    def full_filename(self):
        return f"{self.name}.{self.format.lower()}" if self.format else self.name

    @staticmethod
    def generate_s3_key(material_id, filename, file_format):
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        file_ext = file_format.lower() if file_format else "bin"
        return f"materials/{material_id}/{timestamp}_{filename}.{file_ext}"


class TestModel(Base):
    __tablename__ = "tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    tasks = relationship("TestTaskModel", back_populates="test", cascade="all, delete-orphan", order_by="TestTaskModel.created_at")
    course_tests = relationship("CourseTestModel", back_populates="test", cascade="all, delete-orphan")
    user_course_tests = relationship("UserCourseTestModel", back_populates="test", cascade="all, delete-orphan")

    @property
    def tasks_count(self):
        return len(self.tasks) if self.tasks else 0

    @property
    def total_points(self):
        if not self.tasks:
            return 0
        return sum(task.points for task in self.tasks)


class TestTaskModel(Base):
    __tablename__ = "test_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    test_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tests.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(255), nullable=False)
    description = Column(Text)
    points = Column(Integer, nullable=False, default=1)
    answer_variants = Column(JSON, nullable=False, default=list)
    correct_variant = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    test = relationship("TestModel", back_populates="tasks")
