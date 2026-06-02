from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.users.dto import UserProfileDTO
from app.users.profile_errors import ProfileNotFoundError
from app.users.profile_mapper import load_user_for_profile, map_user_profile
from app.users.profile_scope import ensure_can_view_user_profile


class GetUserProfileUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, target_user_id: UUID, ctx: AuthContext) -> UserProfileDTO:
        await ensure_can_view_user_profile(self.session, ctx, target_user_id)
        user = await load_user_for_profile(self.session, target_user_id)
        if user is None:
            raise ProfileNotFoundError()
        return map_user_profile(user)
