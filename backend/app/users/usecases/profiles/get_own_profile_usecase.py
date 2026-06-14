from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.users.dto import UserProfileDTO
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from app.users.profile_mapper import load_user_for_profile, map_user_profile


class GetOwnProfileUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, ctx: AuthContext) -> UserProfileDTO:
        user = await load_user_for_profile(self.session, UUID(ctx.user_id))
        if user is None:
            raise ProfileNotFoundError()
        if not user.is_active:
            raise ProfileForbiddenError("User account is inactive")
        return map_user_profile(user)
