from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.users.db_models import UserModel, UserRole
from app.users.dto import UserDTO
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError, ProfileNotFoundError

# Roles that root_admin is allowed to assign
ROOT_ADMIN_ASSIGNABLE_ROLES = {
    UserRole.ADMIN_STAFF,
    UserRole.ADMIN_EDUCATION,
    UserRole.ADMIN_SALES,
    UserRole.MANAGER,
    UserRole.SELLER,
}


class ChangeUserRoleUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        target_user_id: UUID,
        new_role: UserRole,
        ctx: AuthContext,
    ) -> UserDTO:
        if str(target_user_id) == ctx.user_id:
            raise ProfileConflictError("Cannot change own role")

        if new_role == UserRole.SUPER_ADMIN:
            raise ProfileForbiddenError("super_admin role can only be assigned by the system")

        if ctx.role == UserRole.ROOT_ADMIN.value and new_role not in ROOT_ADMIN_ASSIGNABLE_ROLES:
            raise ProfileForbiddenError("root_admin cannot assign this role")

        result = await self.session.execute(select(UserModel).where(UserModel.id == target_user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError()

        if user.role == UserRole.SUPER_ADMIN and ctx.role != UserRole.SUPER_ADMIN.value:
            raise ProfileForbiddenError("Only super_admin can reassign super_admin accounts")

        user.role = new_role
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
