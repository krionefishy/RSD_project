from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.compensation_mapper import map_compensation
from app.personnel.db_models import EmployeeCompensationModel
from app.personnel.domain import UpsertEmployeeCompensationRequest
from app.personnel.dto import EmployeeCompensationDTO
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileNotFoundError
from app.users.profile_scope import ensure_staff_admin_can_manage_user, require_staff_admin


class UpsertEmployeeCompensationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        target_user_id: UUID,
        request: UpsertEmployeeCompensationRequest,
        ctx: AuthContext,
    ) -> EmployeeCompensationDTO:
        require_staff_admin(ctx)

        user_result = await self.session.execute(select(UserModel).where(UserModel.id == target_user_id))
        user = user_result.scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError()
        ensure_staff_admin_can_manage_user(ctx, user.role)

        result = await self.session.execute(
            select(EmployeeCompensationModel).where(EmployeeCompensationModel.user_id == target_user_id)
        )
        compensation = result.scalar_one_or_none()
        now = datetime.now()
        if compensation is None:
            compensation = EmployeeCompensationModel(
                user_id=target_user_id,
                base_salary=request.base_salary,
                hourly_rate=request.hourly_rate,
                night_hourly_rate=request.night_hourly_rate,
                updated_at=now,
            )
            self.session.add(compensation)
        else:
            compensation.base_salary = request.base_salary
            compensation.hourly_rate = request.hourly_rate
            compensation.night_hourly_rate = request.night_hourly_rate
            compensation.updated_at = now

        await self.session.commit()
        await self.session.refresh(compensation)
        return map_compensation(compensation)
