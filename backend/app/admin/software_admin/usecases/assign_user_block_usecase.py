from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.locations.db_models import BlockMemberModel, BlockMemberStatus, BlockModel
from app.locations.dto import BlockMemberDTO
from app.users.db_models import UserModel


class AssignUserBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, user_id, block_id: int) -> Optional[BlockMemberDTO]:
        user_result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if user is None:
            return None

        block_result = await self.session.execute(
            select(BlockModel).where(BlockModel.id == block_id)
        )
        block = block_result.scalar_one_or_none()
        if block is None:
            return None

        membership_result = await self.session.execute(
            select(BlockMemberModel).where(BlockMemberModel.user_id == user_id)
        )
        membership = membership_result.scalar_one_or_none()
        if membership is None:
            membership = BlockMemberModel(
                user_id=user_id,
                block_id=block_id,
                status=BlockMemberStatus.PRIMARY.value,
                assigned_at=datetime.now(timezone.utc),
            )
            self.session.add(membership)
        else:
            membership.block_id = block_id
            membership.status = BlockMemberStatus.PRIMARY.value
            membership.assigned_at = datetime.now(timezone.utc)

        await self.session.commit()
        await self.session.refresh(membership)

        return BlockMemberDTO(
            id=membership.id,
            user_id=membership.user_id,
            block_id=membership.block_id,
            status=membership.status,
            assigned_at=membership.assigned_at,
        )
