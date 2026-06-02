from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.test_tasks.delete_test_task_usecase import DeleteTestTaskUseCase
from app.knowledge_base.db_models import TestTaskModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestDeleteTestTaskUseCase:
    async def test_deletes_test_task_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        task = await builder.build_test_task(name="To Delete")

        result = await DeleteTestTaskUseCase(db_session).execute(
            task.id,
            admin_ctx(education_admin),
        )

        assert result is True
        remaining = (
            await db_session.execute(select(TestTaskModel).where(TestTaskModel.id == task.id))
        ).scalar_one_or_none()
        assert remaining is None

    async def test_returns_none_when_task_not_found(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await DeleteTestTaskUseCase(db_session).execute(
            999999,
            admin_ctx(education_admin),
        )

        assert result is None
