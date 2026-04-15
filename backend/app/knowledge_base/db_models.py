from datetime import datetime
from uuid import uuid4

from sqlalchemy import ARRAY, Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID

from storage.pg.database import Base

course_material = Table(
    "course_material",
    Base.metadata,
    Column("course_id", UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("material_id", UUID(as_uuid=True), ForeignKey("materials.id", ondelete="CASCADE"), primary_key=True),
)

course_test = Table(
    "course_test",
    Base.metadata,
    Column("course_id", UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), primary_key=True),
    Column("test_id", UUID(as_uuid=True), ForeignKey("tests.id", ondelete="CASCADE"), primary_key=True),
)


class TestModel(Base):
    __tablename__ = "tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    questions_count = Column(Integer, default=0)
    passing_score = Column(Integer, default=70)
    created_at = Column(DateTime, default=datetime.utcnow)


class TestQuestionModel(Base):
    __tablename__ = "test_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    correct_answer = Column(String(1000), nullable=False)
    points = Column(Integer, default=1)


class TestAssignmentModel(Base):
    __tablename__ = "test_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    test_id = Column(UUID(as_uuid=True), ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), nullable=False)
    deadline = Column(DateTime)
    status = Column(String(50), default="assigned")
    score = Column(Integer)
    max_score = Column(Integer)
    passed = Column(Boolean)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


class MaterialModel(Base):
    __tablename__ = "materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)


class CourseModel(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    categories = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)


class CourseEnrollmentModel(Base):
    __tablename__ = "course_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(50), default="in_progress")
    progress_percent = Column(Integer, default=0)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
