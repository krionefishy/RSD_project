from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


# ===== Tests DTO =====

class TestDTO(BaseModel):
    """Test response DTO."""
    id: UUID
    title: str
    status: str
    questions_count: int
    passing_score: int
    created_at: datetime


class TestResultDTO(BaseModel):
    """Test result response DTO."""
    assignment_id: UUID
    test_id: UUID
    employee_id: UUID
    score: Optional[int]
    max_score: int
    passed: bool
    completed_at: Optional[datetime]


# ===== Materials DTO =====

class MaterialDTO(BaseModel):
    """Material response DTO."""
    id: UUID
    title: str
    content: str
    category: Optional[str]
    course_ids: List[UUID]
    created_at: datetime


# ===== Courses DTO =====

class CourseDTO(BaseModel):
    """Course response DTO."""
    id: UUID
    title: str
    description: Optional[str]
    categories: List[str]
    materials_count: int
    tests_count: int
    created_at: datetime


class EnrollmentDTO(BaseModel):
    """Course enrollment response DTO."""
    enrollment_id: UUID
    course_id: UUID
    employee_id: UUID
    status: str  # "in_progress", "completed"
    progress_percent: int
    enrolled_at: datetime
