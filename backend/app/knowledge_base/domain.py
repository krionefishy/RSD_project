from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ===== Tests Domain =====

class AssignTestRequest(BaseModel):
    """Request to assign test to employee."""
    test_id: UUID
    employee_id: UUID
    deadline: Optional[datetime] = None


class SubmitAnswerRequest(BaseModel):
    """Request to submit test answer."""
    assignment_id: UUID
    question_id: UUID
    answer: str = Field(min_length=1, max_length=1000)


class GetTestResultRequest(BaseModel):
    """Request to get test result."""
    test_id: UUID


# ===== Materials Domain =====

class CreateMaterialRequest(BaseModel):
    """Request to create educational material."""
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    category: Optional[str] = None
    course_ids: List[UUID] = []


class GetMaterialRequest(BaseModel):
    """Request to get material."""
    material_id: UUID


# ===== Courses Domain =====

class CreateCourseRequest(BaseModel):
    """Request to create course."""
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    rating_points: int = Field(ge=0, default=0)
    mrp: int = Field(ge=0, default=0)


class EnrollCourseRequest(BaseModel):
    """Request to enroll employee to course."""
    course_id: int
    employee_id: UUID
