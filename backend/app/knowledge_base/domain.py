from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.users.db_models import UserRole


class UserContext(BaseModel):
    user_id: UUID
    role: UserRole


class CompleteMaterialRequest(BaseModel):
    course_id: int
    material_id: int

    @model_validator(mode="after")
    def validate_ids(self):
        if self.course_id <= 0:
            raise ValueError("course_id должен быть положительным")
        if self.material_id <= 0:
            raise ValueError("material_id должен быть положительным")
        return self


class StartTestRequest(BaseModel):
    course_id: int
    test_id: int

    @model_validator(mode="after")
    def validate_ids(self):
        if self.course_id <= 0:
            raise ValueError("course_id должен быть положительным")
        if self.test_id <= 0:
            raise ValueError("test_id должен быть положительным")
        return self


class SubmitAnswerRequest(BaseModel):
    course_id: int
    test_id: int
    task_id: int
    selected_variant: int

    @model_validator(mode="after")
    def validate_request(self):
        if self.course_id <= 0:
            raise ValueError("course_id должен быть положительным")
        if self.test_id <= 0:
            raise ValueError("test_id должен быть положительным")
        if self.task_id <= 0:
            raise ValueError("task_id должен быть положительным")
        if self.selected_variant < 0:
            raise ValueError("selected_variant не может быть отрицательным")
        return self


class CompleteCourseRequest(BaseModel):
    course_id: int

    @model_validator(mode="after")
    def validate_ids(self):
        if self.course_id <= 0:
            raise ValueError("course_id должен быть положительным")
        return self


class ResolveMaterialAttachmentsRequest(BaseModel):
    course_id: int
    attachment_ids: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_request(self):
        if self.course_id <= 0:
            raise ValueError("course_id должен быть положительным")
        if any(attachment_id <= 0 for attachment_id in self.attachment_ids):
            raise ValueError("attachment_ids должен содержать только положительные id")
        return self
