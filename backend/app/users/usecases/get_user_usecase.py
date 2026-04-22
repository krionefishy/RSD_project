from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.db_models import UserModel
from app.users.dto import UserDTO


class GetUserUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, user_id: UUID) -> Optional[UserDTO]:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None
        return UserDTO(
            id=user.id,
            email=user.email,
            role=user.role.value,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            name=user.full_name,
        )
