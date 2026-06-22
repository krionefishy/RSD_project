from datetime import UTC, datetime, timezone
from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.locations.db_models import BlockMemberModel, BlockMemberStatus, LocationModel, UserLocationModel
from app.users.db_models import UserModel
from app.users.domain import UserAdminUpdate
from app.users.dto import UserDTO
from app.users.profile_scope import ensure_staff_admin_can_manage_user


class UpdateUserAdminUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, user_id, request: UserAdminUpdate, ctx: AuthContext) -> Optional[UserDTO]:
        user_result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if user is None:
            return None

        ensure_staff_admin_can_manage_user(ctx, user.role)

        if request.first_name is not None:
            user.first_name = request.first_name
        if request.middle_name is not None:
            user.middle_name = request.middle_name
        if request.last_name is not None:
            user.last_name = request.last_name
        if request.phone is not None:
            user.phone = request.phone
        if request.position is not None:
            user.position = request.position
        if request.birth_date is not None:
            user.birth_date = request.birth_date

        if request.block_member_status:
            member_result = await self.session.execute(
                select(BlockMemberModel).where(BlockMemberModel.user_id == user_id)
            )
            member = member_result.scalar_one_or_none()
            if member is None:
                return None
            member.status = request.block_member_status
            if request.block_member_status == BlockMemberStatus.RESERVE.value:
                await self.session.execute(
                    delete(UserLocationModel).where(UserLocationModel.user_id == user_id)
                )

        if request.block_member_status == BlockMemberStatus.PRIMARY.value and request.location_id is None:
            assignment_result = await self.session.execute(
                select(UserLocationModel).where(UserLocationModel.user_id == user_id)
            )
            if assignment_result.scalar_one_or_none() is None:
                return None

        if request.location_id is not None and request.block_member_status != BlockMemberStatus.RESERVE.value:
            location_result = await self.session.execute(
                select(LocationModel).where(LocationModel.id == request.location_id)
            )
            location = location_result.scalar_one_or_none()
            if location is None:
                return None

            assignment_result = await self.session.execute(
                select(UserLocationModel).where(UserLocationModel.user_id == user_id)
            )
            assignment = assignment_result.scalar_one_or_none()
            if assignment is None:
                assignment = UserLocationModel(
                    user_id=user_id,
                    location_id=request.location_id,
                    assigned_at=datetime.now(UTC),
                )
                self.session.add(assignment)
            else:
                assignment.location_id = request.location_id
                assignment.assigned_at = datetime.now(UTC)

        await self.session.commit()
        await self.session.refresh(user)

        return UserDTO(
            id=user.id,
            external_system_id=user.external_system_id,
            role=user.role,
            first_name=user.first_name,
            middle_name=user.middle_name,
            last_name=user.last_name,
            phone=user.phone,
            name=user.full_name,
            position=user.position,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            birth_date=user.birth_date,
        )
