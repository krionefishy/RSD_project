from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import TestModel
from app.knowledge_base.domain import UserContext


class DeleteTestUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, test_id: int, ctx: UserContext) -> Optional[bool]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        test = (
            await self.session.execute(select(TestModel).where(TestModel.id == test_id))
        ).scalar_one_or_none()
        if test is None:
            return None

        await self.session.delete(test)
        await self.session.commit()
        return True
