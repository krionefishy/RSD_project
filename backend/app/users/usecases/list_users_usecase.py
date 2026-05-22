from typing import Optional

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.locations.db_models import BlockMemberModel, ManagerBlockModel, UserLocationModel
from app.users.db_models import UserModel
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
    ) -> UsersListDTO:
        statement: Select[tuple[UserModel]] = (
            select(UserModel)
            .options(
                selectinload(UserModel.location_assignments).selectinload(UserLocationModel.location),
                selectinload(UserModel.block_assignments).selectinload(ManagerBlockModel.block),
            )
            .order_by(UserModel.created_at.desc())
        )

        if role is not None:
            statement = statement.where(UserModel.role == role)
        if is_active is not None:
            statement = statement.where(UserModel.is_active == is_active)
        if block_id is not None:
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
                    is_temp_password=user.is_temp_password,
                    birth_date=user.birth_date,
                    location=(
                        LocationBriefDTO(id=location.id, name=location.name)
                        if location is not None
                        else None
                    ),
                    managed_block=(
                        BlockBriefDTO(id=managed_block.id, name=managed_block.name)
                        if managed_block is not None
                        else None
                    ),
                )
            )
        return UsersListDTO(items=items, total=len(items))
