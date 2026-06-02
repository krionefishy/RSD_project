from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import TestModel, TestTaskAssignmentModel, TestTaskModel
from app.knowledge_base.domain import UserContext


class AssignTaskToTestUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        test_id: int,
        task_id: int,
        order: int,
        ctx: UserContext,
    ) -> Optional[bool]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        test = (
            await self.session.execute(select(TestModel).where(TestModel.id == test_id))
        ).scalar_one_or_none()
        task = (
            await self.session.execute(select(TestTaskModel).where(TestTaskModel.id == task_id))
        ).scalar_one_or_none()
        if test is None or task is None:
            return None

        existing = (
            await self.session.execute(
                select(TestTaskAssignmentModel).where(
                    TestTaskAssignmentModel.test_id == test_id,
                    TestTaskAssignmentModel.task_id == task_id,
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            existing.order = order
            await self.session.commit()
            return True

        assignment = TestTaskAssignmentModel(test_id=test_id, task_id=task_id, order=order)
        self.session.add(assignment)
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            return None
        return True
