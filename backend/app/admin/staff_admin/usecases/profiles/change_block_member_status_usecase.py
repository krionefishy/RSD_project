from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.locations.db_models import BlockMemberModel
from app.personnel.domain import ChangeBlockMemberStatusRequest
from app.users.dto import UserProfileDTO
from app.users.profile_errors import ProfileNotFoundError
from app.users.profile_mapper import load_user_for_profile, map_user_profile
from app.users.profile_scope import require_staff_admin


class ChangeBlockMemberStatusUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        target_user_id: UUID,
        request: ChangeBlockMemberStatusRequest,
        ctx: AuthContext,
    ) -> UserProfileDTO:
        require_staff_admin(ctx)

        result = await self.session.execute(
            select(BlockMemberModel).where(
                BlockMemberModel.user_id == target_user_id,
                BlockMemberModel.block_id == request.block_id,
            )
        )
        membership = result.scalar_one_or_none()
        if membership is None:
            raise ProfileNotFoundError("Block membership not found")

        membership.status = request.status
        await self.session.commit()

        loaded = await load_user_for_profile(self.session, target_user_id)
        if loaded is None:
            raise ProfileNotFoundError()
        return map_user_profile(loaded)
