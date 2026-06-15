from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.locations.db_models import UserLocationModel
from app.users.db_models import UserModel
from app.users.profile_scope import ensure_staff_admin_can_manage_user


class RemoveUserLocationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, user_id, ctx: AuthContext) -> Optional[bool]:
        user_result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if user is None:
            return None

        ensure_staff_admin_can_manage_user(ctx, user.role)

        result = await self.session.execute(
            delete(UserLocationModel).where(UserLocationModel.user_id == user_id)
        )
        await self.session.commit()

        return result.rowcount > 0
