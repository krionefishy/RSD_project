from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import UpdateTestTaskRequest
from app.admin.educ_admin.usecases.test_tasks.update_test_task_usecase import UpdateTestTaskUseCase
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestUpdateTestTaskUseCase:
    async def test_updates_test_task_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        task = await builder.build_test_task(name="Old Task")

        result = await UpdateTestTaskUseCase(db_session).execute(
            task.id,
            UpdateTestTaskRequest(name="Updated Task", points=20),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.name == "Updated Task"
        assert result.points == 20

    async def test_returns_none_when_task_not_found(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await UpdateTestTaskUseCase(db_session).execute(
            999999,
            UpdateTestTaskRequest(name="Missing"),
            admin_ctx(education_admin),
        )

        assert result is None
