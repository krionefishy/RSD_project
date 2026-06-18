from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.users.db_models import UserModel, UserRole
from app.users.dto import UserDTO
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError, ProfileNotFoundError


class AssignRootAdminUseCase:
    """Grant root_admin role to any non-super_admin user.

    Only callable by super_admin.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, target_user_id: UUID, ctx: AuthContext) -> UserDTO:
        if ctx.role != UserRole.SUPER_ADMIN.value:
            raise ProfileForbiddenError("Only super_admin can assign root_admin role")

        if str(target_user_id) == ctx.user_id:
            raise ProfileConflictError("Cannot assign root_admin to own account")

        result = await self.session.execute(select(UserModel).where(UserModel.id == target_user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError()

        if user.role == UserRole.SUPER_ADMIN:
            raise ProfileForbiddenError("super_admin role cannot be converted to root_admin")

        user.role = UserRole.ROOT_ADMIN
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
        )
