from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class CourseDTO(BaseModel):
    id: int
    name: str
    description: Optional[str]
    rating_points: int
    mrp: int
    materials_count: int
    tests_count: int
    created_at: datetime
    materials: List["CourseMaterialItemDTO"]
    tests: List["CourseTestItemDTO"]
    user_points_by_course: Optional[int] = None
    is_course_completed: Optional[bool] = None


class CourseListItemDTO(BaseModel):
    id: int
    name: str
    description: Optional[str]
    materials_count: int
    tests_count: int


class CoursesListDTO(BaseModel):
    items: List[CourseListItemDTO]


class MaterialAttachmentDTO(BaseModel):
    id: int
    name: str
    format: str


class MaterialDTO(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str]
    text: str
    attachments: List[MaterialAttachmentDTO]
    course_id: int
    created_at: datetime


class CourseMaterialItemDTO(BaseModel):
    id: int
    material_id: int
    name: str
    category: str
    description: Optional[str]
    is_completed: bool = False


class TestTaskDTO(BaseModel):
    id: int
    name: str
    description: Optional[str]
    points: int
    answer_variants: List


class TestDTO(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str]
    is_final: bool
    pass_score_percent: int
    tasks_count: int
    total_points: int
    course_id: int
    created_at: datetime


class CourseTestItemDTO(BaseModel):
    id: int
    test_id: int
    name: str
    category: str
    is_final: bool
    tasks_count: int
    is_passed: bool = False
    score: Optional[int] = None


class UserCourseDTO(BaseModel):
    course_id: int
    course_name: str
    user_points_by_course: int
    is_course_completed: bool
    is_course_completed_successfully: bool
    completion_percentage: float


class UserCoursesListDTO(BaseModel):
    items: List[UserCourseDTO]
    user_id: str


class CompleteMaterialResultDTO(BaseModel):
    material_id: int
    course_id: int


class StartTestResultDTO(BaseModel):
    test_id: int
    test_name: str
    tasks_count: int
    first_task: TestTaskDTO


class SubmitAnswerResultDTO(BaseModel):
    is_correct: bool
    points_earned: int
    next_task: Optional[TestTaskDTO]
    is_test_completed: bool


class TestResultDTO(BaseModel):
    test_id: int
    test_name: str
    score: int
    max_score: int
    percentage: float
    is_passed: bool


class CompleteCourseResultDTO(BaseModel):
    course_id: int
    completed: bool
    message: str
    completed_materials: int
    total_materials: int
    passed_tests: int
    total_tests: int
    user_points: int
    required_points: int


class MaterialsListDTO(BaseModel):
    items: List[MaterialDTO]


class MaterialAttachmentLinkDTO(BaseModel):
    attachment_id: int
    url: str


class MaterialAttachmentLinksDTO(BaseModel):
    items: List[MaterialAttachmentLinkDTO]


class TestsListDTO(BaseModel):
    items: List[TestDTO]


class TestTaskAdminDTO(BaseModel):
    id: int
    name: str
    description: Optional[str]
    points: int
    answer_variants: List[str]
    correct_variant: int


class CourseEnrollmentDTO(BaseModel):
    user_id: UUID
    name: str
    progress: float
    is_completed: bool


class CourseEnrollmentsListDTO(BaseModel):
    items: List[CourseEnrollmentDTO]
