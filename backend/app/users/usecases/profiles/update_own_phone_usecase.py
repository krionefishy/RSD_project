from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import select

from app.users.db_models import UserModel
from app.users.dto import UserDTO

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.auth.deps import AuthContext


class UpdateOwnPhoneUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, ctx: AuthContext, phone: str | None) -> UserDTO | None:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == ctx.user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None

        normalized = phone.strip() if phone else None
        user.phone = normalized or None
        user.updated_at = datetime.now()
        await self.session.commit()
        await self.session.refresh(user)

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
        )
