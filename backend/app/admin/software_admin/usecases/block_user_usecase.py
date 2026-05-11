from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.redis_store import RefreshTokenStore
from app.users.db_models import UserModel, UserRole
from app.users.dto import UserDTO


class BlockUserUseCase:
    def __init__(self, session: AsyncSession, refresh_store: RefreshTokenStore):
        self.session = session
        self.refresh_store = refresh_store

    async def execute(self, user_id) -> Optional[UserDTO]:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None
        if user.role == UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot block super admin",
            )

        user.is_active = False
        await self.session.commit()
        await self.refresh_store.delete_all_for_user(user.id)

        return UserDTO(
            id=user.id,
            external_system_id=user.external_system_id,
            role=user.role.value,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            name=user.full_name,
            position=user.position,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_temp_password=user.is_temp_password,
        )
