from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.users.db_models import UserModel
from app.users.dto import UserProfileDTO
from app.users.profile_errors import ProfileNotFoundError
from app.users.profile_mapper import load_user_for_profile, map_user_profile
from app.users.profile_scope import ensure_can_manage_user, require_staff_admin


class UnblockEmployeeProfileUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, target_user_id: UUID, ctx: AuthContext) -> UserProfileDTO:
        require_staff_admin(ctx)

        result = await self.session.execute(select(UserModel).where(UserModel.id == target_user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError()

        ensure_can_manage_user(ctx, user.role)

        user.is_active = True
        await self.session.commit()

        loaded = await load_user_for_profile(self.session, target_user_id)
        if loaded is None:
            raise ProfileNotFoundError()
        return map_user_profile(loaded)
