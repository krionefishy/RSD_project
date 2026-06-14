from typing import Optional
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.locations.db_models import BlockMemberModel, ManagerBlockModel, UserLocationModel
from app.users.db_models import UserModel, UserRole
from app.users.dto import BlockBriefDTO, LocationBriefDTO, UserDTO, UsersListDTO


class ListUsersUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        *,
        block_id: Optional[int] = None,
        location_id: Optional[int] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        manager_id: UUID | None = None,
    ) -> UsersListDTO:
        statement: Select[tuple[UserModel]] = (
            select(UserModel)
            .options(
                selectinload(UserModel.location_assignments).selectinload(UserLocationModel.location),
                selectinload(UserModel.block_assignments).selectinload(ManagerBlockModel.block),
                selectinload(UserModel.block_memberships).selectinload(BlockMemberModel.block),
            )
            .order_by(UserModel.created_at.desc())
        )

        manager_block_ids: list[int] | None = None
        if manager_id is not None:
            block_ids_result = await self.session.execute(
                select(ManagerBlockModel.block_id).where(ManagerBlockModel.manager_id == manager_id)
            )
            manager_block_ids = [row[0] for row in block_ids_result.all()]
            if not manager_block_ids:
                return UsersListDTO(items=[], total=0)
            if block_id is not None and block_id not in manager_block_ids:
                return UsersListDTO(items=[], total=0)
            if block_id is not None:
                manager_block_ids = [block_id]

        if role is not None:
            statement = statement.where(UserModel.role == role)
        elif manager_id is not None:
            statement = statement.where(UserModel.role == UserRole.SELLER.value)
        if is_active is not None:
            statement = statement.where(UserModel.is_active == is_active)
        if manager_block_ids is not None:
            statement = statement.join(BlockMemberModel, BlockMemberModel.user_id == UserModel.id).where(
                BlockMemberModel.block_id.in_(manager_block_ids)
            )
        elif block_id is not None:
            statement = statement.join(BlockMemberModel, BlockMemberModel.user_id == UserModel.id).where(
                BlockMemberModel.block_id == block_id
            )
        if location_id is not None:
            statement = statement.join(UserLocationModel, UserLocationModel.user_id == UserModel.id).where(
                UserLocationModel.location_id == location_id
            )

        result = await self.session.execute(statement)
        users = result.scalars().unique().all()

        items: list[UserDTO] = []
        for user in users:
            location = user.location
            membership = user.block_memberships[0] if user.block_memberships else None
            block = membership.block if membership and membership.block else None
            managed_block = user.managed_block
            items.append(
                UserDTO(
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
            )
        return UsersListDTO(items=items, total=len(items))
