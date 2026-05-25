from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import TestTaskAssignmentModel
from app.knowledge_base.domain import UserContext


class RemoveTaskFromTestUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        test_id: int,
        task_id: int,
        ctx: UserContext,
    ) -> Optional[bool]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        assignment = (
            await self.session.execute(
                select(TestTaskAssignmentModel).where(
                    TestTaskAssignmentModel.test_id == test_id,
                    TestTaskAssignmentModel.task_id == task_id,
                )
            )
        ).scalar_one_or_none()
        if assignment is None:
            return None

        await self.session.delete(assignment)
        await self.session.commit()
        return True
