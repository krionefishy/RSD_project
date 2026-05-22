from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.locations.db_models import BlockMemberModel, UserLocationModel
from app.users.db_models import UserModel
from app.users.dto import BlockBriefDTO, LocationBriefDTO, UserProfileDTO

PROFILE_LOAD_OPTIONS = (
    selectinload(UserModel.location_assignments).selectinload(UserLocationModel.location),
    selectinload(UserModel.block_memberships).selectinload(BlockMemberModel.block),
)


async def load_user_for_profile(session: AsyncSession, user_id: UUID) -> UserModel | None:
    result = await session.execute(
        select(UserModel).where(UserModel.id == user_id).options(*PROFILE_LOAD_OPTIONS)
    )
    return result.scalar_one_or_none()


def map_user_profile(user: UserModel) -> UserProfileDTO:
    location = user.location
    membership = user.block_memberships[0] if user.block_memberships else None
    block = membership.block if membership and membership.block else None
    return UserProfileDTO(
        id=user.id,
        external_system_id=user.external_system_id,
        role=user.role,
        first_name=user.first_name,
        middle_name=user.middle_name,
        last_name=user.last_name,
        phone=user.phone,
        birth_date=user.birth_date,
        position=user.position,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_temp_password=user.is_temp_password,
        location=(
            LocationBriefDTO(id=location.id, name=location.name) if location is not None else None
        ),
        block=(BlockBriefDTO(id=block.id, name=block.name) if block is not None else None),
        block_member_status=membership.status if membership is not None else None,
        seller_role=user.seller_role,
    )
