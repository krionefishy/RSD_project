from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.locations.db_models import BlockModel, ManagerBlockModel
from app.users.db_models import UserModel, UserRole
from app.users.dto import ManagerBlockDTO


class AssignManagerBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, manager_id, block_id: int) -> Optional[ManagerBlockDTO]:
        user_result = await self.session.execute(
            select(UserModel).where(UserModel.id == manager_id)
        )
        manager = user_result.scalar_one_or_none()
        if manager is None or manager.role != UserRole.MANAGER:
            return None

        block_result = await self.session.execute(
            select(BlockModel).where(BlockModel.id == block_id)
        )
        block = block_result.scalar_one_or_none()
        if block is None:
            return None

        await self.session.execute(
            delete(ManagerBlockModel).where(ManagerBlockModel.manager_id == manager_id)
        )

        assignment = ManagerBlockModel(
            manager_id=manager_id,
            block_id=block_id,
            assigned_at=datetime.now(),
        )
        self.session.add(assignment)
        await self.session.commit()
        await self.session.refresh(assignment)

        return ManagerBlockDTO(
            id=assignment.id,
            manager_id=assignment.manager_id,
            block_id=assignment.block_id,
            assigned_at=assignment.assigned_at,
        )
