from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.compensation_mapper import map_compensation
from app.personnel.db_models import EmployeeCompensationModel
from app.personnel.dto import EmployeeCompensationDTO
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileNotFoundError
from app.users.profile_scope import ensure_can_view_user_profile
from app.users.usecases.profiles.get_own_compensation_usecase import GetOwnCompensationUseCase


class GetEmployeeCompensationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        target_user_id: UUID,
        ctx: AuthContext,
    ) -> EmployeeCompensationDTO | None:
        if str(target_user_id) == ctx.user_id:
            return await GetOwnCompensationUseCase(self.session).execute(ctx)

        await ensure_can_view_user_profile(self.session, ctx, target_user_id)

        user_result = await self.session.execute(
            select(UserModel.id).where(UserModel.id == target_user_id)
        )
        if user_result.scalar_one_or_none() is None:
            raise ProfileNotFoundError()

        result = await self.session.execute(
            select(EmployeeCompensationModel).where(EmployeeCompensationModel.user_id == target_user_id)
        )
        compensation = result.scalar_one_or_none()
        if compensation is None:
            return None
        return map_compensation(compensation)
