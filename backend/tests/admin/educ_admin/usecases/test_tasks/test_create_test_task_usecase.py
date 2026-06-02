from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import CreateTestTaskRequest
from app.admin.educ_admin.usecases.test_tasks.create_test_task_usecase import CreateTestTaskUseCase
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx


class TestCreateTestTaskUseCase:
    async def test_creates_test_task_when_education_admin(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await CreateTestTaskUseCase(db_session).execute(
            CreateTestTaskRequest(
                name="Question 1",
                points=5,
                answer_variants=["A", "B"],
                correct_variant=1,
            ),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.name == "Question 1"
        assert result.points == 5
        assert result.correct_variant == 1
