from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.locations.db_models import (
    BlockLocationModel,
    BlockMemberModel,
    BlockModel,
    LocationModel,
    ManagerBlockModel,
    UserLocationModel,
)
from app.users.db_models import UserModel


def _display_name(user: UserModel) -> str:
    parts = [user.last_name, user.first_name, user.middle_name]
    name = " ".join(part for part in parts if part)
    return name or user.external_system_id


async def count_locations_by_block(session: AsyncSession) -> dict[int, int]:
    result = await session.execute(
        select(BlockLocationModel.block_id, func.count(BlockLocationModel.id))
        .group_by(BlockLocationModel.block_id)
    )
    return {row[0]: row[1] for row in result.all()}


async def count_members_by_block(session: AsyncSession) -> dict[int, int]:
    result = await session.execute(
        select(BlockMemberModel.block_id, func.count(BlockMemberModel.id))
        .group_by(BlockMemberModel.block_id)
    )
    return {row[0]: row[1] for row in result.all()}


async def count_users_by_location(session: AsyncSession) -> dict[int, int]:
    result = await session.execute(
        select(UserLocationModel.location_id, func.count(UserLocationModel.id))
        .group_by(UserLocationModel.location_id)
    )
    return {row[0]: row[1] for row in result.all()}


async def managers_by_block(session: AsyncSession) -> dict[int, tuple[UUID, str]]:
    result = await session.execute(
        select(ManagerBlockModel, UserModel)
        .join(UserModel, UserModel.id == ManagerBlockModel.manager_id)
    )
    mapping: dict[int, tuple[UUID, str]] = {}
    for manager_block, user in result.all():
        mapping[manager_block.block_id] = (user.id, _display_name(user))
    return mapping


async def block_names_by_id(session: AsyncSession, block_ids: set[int]) -> dict[int, str]:
    if not block_ids:
        return {}
    result = await session.execute(
        select(BlockModel.id, BlockModel.name).where(BlockModel.id.in_(block_ids))
    )
    return {row[0]: row[1] for row in result.all()}


async def manager_block_ids(session: AsyncSession, manager_id: UUID) -> list[int]:
    result = await session.execute(
        select(ManagerBlockModel.block_id).where(ManagerBlockModel.manager_id == manager_id)
    )
    return [row[0] for row in result.all()]


async def location_ids_for_blocks(session: AsyncSession, block_ids: list[int]) -> list[int]:
    if not block_ids:
        return []
    result = await session.execute(
        select(BlockLocationModel.location_id).where(BlockLocationModel.block_id.in_(block_ids))
    )
    return [row[0] for row in result.all()]
