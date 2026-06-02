from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.profile_helpers import (
    assign_user_block,
    assign_user_location,
    ensure_location_in_block,
    remove_user_block,
    remove_user_location,
)
from app.auth.deps import AuthContext
from app.locations.db_models import BlockMemberModel, BlockMemberStatus
from app.personnel.domain import UpdateEmployeeProfileRequest
from app.users.db_models import UserModel
from app.users.dto import UserProfileDTO
from app.users.profile_errors import ProfileNotFoundError
from app.users.profile_mapper import load_user_for_profile, map_user_profile
from app.users.profile_scope import require_staff_admin


class UpdateEmployeeProfileUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        target_user_id: UUID,
        request: UpdateEmployeeProfileRequest,
        ctx: AuthContext,
    ) -> UserProfileDTO:
        require_staff_admin(ctx)

        result = await self.session.execute(select(UserModel).where(UserModel.id == target_user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError()

        if request.first_name is not None:
            user.first_name = request.first_name
        if request.middle_name is not None:
            user.middle_name = request.middle_name
        if request.last_name is not None:
            user.last_name = request.last_name
        if request.phone is not None:
            user.phone = request.phone
        if request.birth_date is not None:
            user.birth_date = request.birth_date
        if request.position is not None:
            user.position = request.position

        if request.location_id is not None and request.block_id is not None:
            await ensure_location_in_block(self.session, request.block_id, request.location_id)

        if request.block_id is not None:
            status = request.block_member_status or BlockMemberStatus.PRIMARY.value
            await assign_user_block(self.session, target_user_id, request.block_id, status=status)
            if request.location_id is not None:
                await assign_user_location(self.session, target_user_id, request.location_id)
            elif status == BlockMemberStatus.RESERVE.value:
                await remove_user_location(self.session, target_user_id)
        elif request.block_id is None and "block_id" in request.model_fields_set:
            await remove_user_block(self.session, target_user_id)

        if request.location_id is not None and request.block_id is None:
            await assign_user_location(self.session, target_user_id, request.location_id)
        elif request.location_id is None and "location_id" in request.model_fields_set:
            await remove_user_location(self.session, target_user_id)

        if request.block_member_status is not None and request.block_id is None:
            member_result = await self.session.execute(
                select(BlockMemberModel).where(BlockMemberModel.user_id == target_user_id)
            )
            member = member_result.scalar_one_or_none()
            if member is not None:
                member.status = request.block_member_status
                if request.block_member_status == BlockMemberStatus.RESERVE.value:
                    await remove_user_location(self.session, target_user_id)

        await self.session.commit()
        loaded = await load_user_for_profile(self.session, target_user_id)
        if loaded is None:
            raise ProfileNotFoundError()
        return map_user_profile(loaded)
