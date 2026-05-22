from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.locations.db_models import BlockLocationModel, BlockMemberModel, BlockMemberStatus, BlockModel, LocationModel, UserLocationModel
from app.users.profile_errors import ProfileConflictError, ProfileNotFoundError


async def ensure_location_exists(session: AsyncSession, location_id: int) -> LocationModel:
    result = await session.execute(select(LocationModel).where(LocationModel.id == location_id))
    location = result.scalar_one_or_none()
    if location is None:
        raise ProfileNotFoundError("Location not found")
    return location


async def ensure_block_exists(session: AsyncSession, block_id: int) -> BlockModel:
    result = await session.execute(select(BlockModel).where(BlockModel.id == block_id))
    block = result.scalar_one_or_none()
    if block is None:
        raise ProfileNotFoundError("Block not found")
    return block


async def ensure_location_in_block(session: AsyncSession, block_id: int, location_id: int) -> None:
    result = await session.execute(
        select(BlockLocationModel.id).where(
            BlockLocationModel.block_id == block_id,
            BlockLocationModel.location_id == location_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise ProfileConflictError("Location does not belong to the block")


async def assign_user_location(
    session: AsyncSession,
    user_id: UUID,
    location_id: int,
    assigned_at: datetime | None = None,
) -> None:
    await ensure_location_exists(session, location_id)
    result = await session.execute(select(UserLocationModel).where(UserLocationModel.user_id == user_id))
    assignment = result.scalar_one_or_none()
    now = assigned_at or datetime.now()
    if assignment is None:
        session.add(
            UserLocationModel(
                user_id=user_id,
                location_id=location_id,
                assigned_at=now,
            )
        )
    else:
        assignment.location_id = location_id
        assignment.assigned_at = now


async def remove_user_location(session: AsyncSession, user_id: UUID) -> None:
    await session.execute(delete(UserLocationModel).where(UserLocationModel.user_id == user_id))


async def assign_user_block(
    session: AsyncSession,
    user_id: UUID,
    block_id: int,
    status: str = BlockMemberStatus.PRIMARY.value,
    assigned_at: datetime | None = None,
) -> BlockMemberModel:
    await ensure_block_exists(session, block_id)
    result = await session.execute(select(BlockMemberModel).where(BlockMemberModel.user_id == user_id))
    membership = result.scalar_one_or_none()
    now = assigned_at or datetime.now()
    if membership is None:
        membership = BlockMemberModel(
            user_id=user_id,
            block_id=block_id,
            status=status,
            assigned_at=now,
        )
        session.add(membership)
    else:
        membership.block_id = block_id
        membership.status = status
        membership.assigned_at = now
    return membership


async def remove_user_block(session: AsyncSession, user_id: UUID) -> None:
    await session.execute(delete(BlockMemberModel).where(BlockMemberModel.user_id == user_id))
