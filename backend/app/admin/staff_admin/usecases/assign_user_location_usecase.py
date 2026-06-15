from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.locations.db_models import LocationModel, UserLocationModel
from app.users.db_models import UserModel
from app.users.dto import UserLocationDTO
from app.users.profile_scope import ensure_staff_admin_can_manage_user


class AssignUserLocationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, user_id, location_id: int, ctx: AuthContext) -> Optional[UserLocationDTO]:
        user_result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if user is None:
            return None

        ensure_staff_admin_can_manage_user(ctx, user.role)

        location_result = await self.session.execute(
            select(LocationModel).where(LocationModel.id == location_id)
        )
        if location_result.scalar_one_or_none() is None:
            return None

        assignment_result = await self.session.execute(
            select(UserLocationModel).where(UserLocationModel.user_id == user_id)
        )
        assignment = assignment_result.scalar_one_or_none()
        if assignment is None:
            assignment = UserLocationModel(
                user_id=user_id,
                location_id=location_id,
                assigned_at=datetime.now(),
            )
            self.session.add(assignment)
        else:
            assignment.location_id = location_id
            assignment.assigned_at = datetime.now()

        await self.session.commit()
        await self.session.refresh(assignment)

        return UserLocationDTO(
            id=assignment.id,
            user_id=assignment.user_id,
            location_id=assignment.location_id,
            assigned_at=assignment.assigned_at,
        )
