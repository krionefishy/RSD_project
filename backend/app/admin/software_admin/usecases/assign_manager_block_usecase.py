from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.locations.db_models import BlockModel, ManagerBlockModel
from app.users.db_models import UserModel, UserRole
from app.users.dto import ManagerBlockDTO


class AssignManagerBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, manager_id, block_id: int) -> ManagerBlockDTO | None:
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

        existing_result = await self.session.execute(
            select(ManagerBlockModel).where(
                ManagerBlockModel.manager_id == manager_id,
                ManagerBlockModel.block_id == block_id,
            )
        )
        existing = existing_result.scalar_one_or_none()
        if existing is not None:
            return ManagerBlockDTO(
                id=existing.id,
                manager_id=existing.manager_id,
                block_id=existing.block_id,
                assigned_at=existing.assigned_at,
            )

        current_assignment_result = await self.session.execute(
            select(ManagerBlockModel, BlockModel)
            .join(BlockModel, BlockModel.id == ManagerBlockModel.block_id)
            .where(ManagerBlockModel.manager_id == manager_id)
        )
        current_assignment = current_assignment_result.first()
        if current_assignment is not None:
            _, current_block = current_assignment
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Менеджер уже назначен на блок «{current_block.name}». Один менеджер может быть привязан только к одному блоку.",
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
