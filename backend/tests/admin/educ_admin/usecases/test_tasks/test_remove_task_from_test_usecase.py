from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.test_tasks.remove_task_from_test_usecase import (
    RemoveTaskFromTestUseCase,
)
from app.knowledge_base.db_models import TestTaskAssignmentModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestRemoveTaskFromTestUseCase:
    async def test_removes_task_from_test_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        test = await builder.build_test()
        task = await builder.build_test_task()
        await builder.build_test_task_assignment(test=test, task=task)

        result = await RemoveTaskFromTestUseCase(db_session).execute(
            test.id,
            task.id,
            admin_ctx(education_admin),
        )

        assert result is True
        remaining = (
            await db_session.execute(
                select(TestTaskAssignmentModel).where(
                    TestTaskAssignmentModel.test_id == test.id,
                    TestTaskAssignmentModel.task_id == task.id,
                )
            )
        ).scalar_one_or_none()
        assert remaining is None

    async def test_returns_none_when_assignment_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        test = await builder.build_test()
        task = await builder.build_test_task()

        result = await RemoveTaskFromTestUseCase(db_session).execute(
            test.id,
            task.id,
            admin_ctx(education_admin),
        )

        assert result is None
