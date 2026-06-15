from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.dto import DeleteResultDTO
from app.users.db_models import UserModel, UserRole
from app.users.profile_errors import ProfileConflictError, ProfileNotFoundError
from app.users.profile_scope import ensure_staff_admin_can_manage_user, require_staff_admin


class DeleteEmployeeProfileUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, target_user_id: UUID, ctx: AuthContext) -> DeleteResultDTO:
        require_staff_admin(ctx)

        if str(target_user_id) == ctx.user_id:
            raise ProfileConflictError("Cannot delete own profile")

        result = await self.session.execute(select(UserModel).where(UserModel.id == target_user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError()

        ensure_staff_admin_can_manage_user(ctx, user.role)

        if user.role in {UserRole.ROOT_ADMIN.value, UserRole.SUPER_ADMIN.value}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete privileged admin",
            )

        await self.session.delete(user)
        await self.session.commit()
        return DeleteResultDTO(deleted=True)
