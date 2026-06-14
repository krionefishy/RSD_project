from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.locations.db_models import BlockMemberModel, ManagerBlockModel, UserLocationModel
from app.users.db_models import UserModel
from app.users.dto import BlockBriefDTO, LocationBriefDTO, UserDTO


class GetUserUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, user_id: UUID) -> Optional[UserDTO]:
        result = await self.session.execute(
            select(UserModel)
            .where(UserModel.id == user_id)
            .options(
                selectinload(UserModel.location_assignments).selectinload(
                    UserLocationModel.location
                ),
                selectinload(UserModel.block_assignments).selectinload(
                    ManagerBlockModel.block
                ),
                selectinload(UserModel.block_memberships).selectinload(
                    BlockMemberModel.block
                ),
            )
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None
        location = user.location
        membership = user.block_memberships[0] if user.block_memberships else None
        block = membership.block if membership and membership.block else None
        managed_block = user.managed_block
        return UserDTO(
            id=user.id,
            external_system_id=user.external_system_id,
            role=user.role,
            first_name=user.first_name,
            middle_name=user.middle_name,
            last_name=user.last_name,
            phone=user.phone,
            name=user.full_name,
            position=user.position,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            birth_date=user.birth_date,
            location=(
                LocationBriefDTO(id=location.id, name=location.name)
                if location is not None
                else None
            ),
            block=(
                BlockBriefDTO(id=block.id, name=block.name)
                if block is not None
                else None
            ),
            block_member_status=membership.status if membership is not None else None,
            managed_block=(
                BlockBriefDTO(id=managed_block.id, name=managed_block.name)
                if managed_block is not None
                else None
            ),
        )
