from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class CreateCourseRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    rating_points: int = Field(ge=0, default=0)
    mrp: int = Field(ge=0, default=0)


class UpdateCourseRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    rating_points: int | None = Field(default=None, ge=0)
    mrp: int | None = Field(default=None, ge=0)


class CreateMaterialRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=100)
    description: str | None = None
    text: str = Field(default="")


class UpdateMaterialRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    text: str | None = None


class CreateTestRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=100)
    description: str | None = None
    is_final: bool = False
    pass_score_percent: int = Field(ge=0, le=100, default=70)
    time_limit_minutes: int | None = Field(default=None, gt=0, description="Лимит времени в минутах")
    max_attempts: int | None = Field(default=None, gt=0, description="Максимальное количество попыток")


class UpdateTestRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    is_final: bool | None = None
    pass_score_percent: int | None = Field(default=None, ge=0, le=100)
    time_limit_minutes: int | None = Field(default=None, gt=0, description="Лимит времени в минутах")
    max_attempts: int | None = Field(default=None, gt=0, description="Максимальное количество попыток")


class CreateTestTaskRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    points: int = Field(gt=0, default=1)
    answer_variants: list[str] = Field(min_length=2)
    correct_variant: int = Field(ge=0)

    @model_validator(mode="after")
    def validate_variants(self):
        if self.correct_variant >= len(self.answer_variants):
            raise ValueError("correct_variant out of range")
        cleaned = [variant.strip() for variant in self.answer_variants if variant.strip()]
        if len(cleaned) < 2:
            raise ValueError("answer_variants must contain at least two non-empty items")
        self.answer_variants = cleaned
        return self


class UpdateTestTaskRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    points: int | None = Field(default=None, gt=0)
    answer_variants: list[str] | None = None
    correct_variant: int | None = Field(default=None, ge=0)


class AssignCourseEnrollmentRequest(BaseModel):
    user_id: UUID


class AssignMaterialToCourseRequest(BaseModel):
    material_id: int
    order: int = Field(ge=0, default=0)


class AssignTestToCourseRequest(BaseModel):
    test_id: int
    is_final: bool = False
