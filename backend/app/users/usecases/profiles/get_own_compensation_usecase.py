from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.compensation_mapper import map_compensation
from app.personnel.db_models import EmployeeCompensationModel
from app.personnel.dto import EmployeeCompensationDTO
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError


class GetOwnCompensationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, ctx: AuthContext) -> EmployeeCompensationDTO | None:
        user_result = await self.session.execute(
            select(UserModel).where(UserModel.id == UUID(ctx.user_id))
        )
        user = user_result.scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError()
        if not user.is_active:
            raise ProfileForbiddenError("User account is inactive")

        result = await self.session.execute(
            select(EmployeeCompensationModel).where(EmployeeCompensationModel.user_id == user.id)
        )
        compensation = result.scalar_one_or_none()
        if compensation is None:
            return None
        return map_compensation(compensation)
