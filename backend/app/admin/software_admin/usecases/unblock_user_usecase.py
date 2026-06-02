from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.db_models import UserModel
from app.users.dto import UserDTO


class UnblockUserUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, user_id) -> Optional[UserDTO]:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None

        user.is_active = True
        await self.session.commit()

        return UserDTO(
            id=user.id,
            external_system_id=user.external_system_id,
            role=user.role,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            name=user.full_name,
            position=user.position,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_temp_password=user.is_temp_password,
        )
