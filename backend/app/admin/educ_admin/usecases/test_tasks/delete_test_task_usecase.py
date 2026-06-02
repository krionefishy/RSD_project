from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import TestTaskModel
from app.knowledge_base.domain import UserContext


class DeleteTestTaskUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, task_id: int, ctx: UserContext) -> Optional[bool]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        task = (
            await self.session.execute(select(TestTaskModel).where(TestTaskModel.id == task_id))
        ).scalar_one_or_none()
        if task is None:
            return None

        await self.session.delete(task)
        await self.session.commit()
        return True
