from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.locations.db_models import ManagerBlockModel


class RemoveManagerBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, manager_id: UUID, block_id: int) -> Optional[bool]:
        assignment = (
            await self.session.execute(
                select(ManagerBlockModel).where(
                    ManagerBlockModel.manager_id == manager_id,
                    ManagerBlockModel.block_id == block_id,
                )
            )
        ).scalar_one_or_none()
        if assignment is None:
            return None
        await self.session.delete(assignment)
        await self.session.commit()
        return True
