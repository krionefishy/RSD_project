from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.test_tasks.assign_task_to_test_usecase import (
    AssignTaskToTestUseCase,
)
from app.knowledge_base.db_models import TestTaskAssignmentModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestAssignTaskToTestUseCase:
    async def test_assigns_task_to_test_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        test = await builder.build_test()
        task = await builder.build_test_task(name="Standalone Task")

        result = await AssignTaskToTestUseCase(db_session).execute(
            test.id,
            task.id,
            order=2,
            ctx=admin_ctx(education_admin),
        )

        assert result is True
        assignment = (
            await db_session.execute(
                select(TestTaskAssignmentModel).where(
                    TestTaskAssignmentModel.test_id == test.id,
                    TestTaskAssignmentModel.task_id == task.id,
                )
            )
        ).scalar_one()
        assert assignment.order == 2

    async def test_returns_none_when_test_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        task = await builder.build_test_task()

        result = await AssignTaskToTestUseCase(db_session).execute(
            999999,
            task.id,
            order=0,
            ctx=admin_ctx(education_admin),
        )

        assert result is None
