from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.locations.db_models import BlockLocationModel, BlockMemberModel, ManagerBlockModel
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileForbiddenError

STAFF_ADMIN_ROLES = {
    UserRole.ADMIN_STAFF.value,
    UserRole.ROOT_ADMIN.value,
    UserRole.SUPER_ADMIN.value,
}
UNRESTRICTED_ROLES = {UserRole.ROOT_ADMIN.value, UserRole.SUPER_ADMIN.value}
SELLER_ROLES = {UserRole.SELLER.value}
STAFF_MANAGEABLE_ROLES = {UserRole.SELLER.value, UserRole.MANAGER.value}


def require_staff_admin(ctx: AuthContext) -> None:
    if ctx.role not in STAFF_ADMIN_ROLES:
        raise ProfileForbiddenError()


def is_staff_manageable_role(role: str) -> bool:
    return role in STAFF_MANAGEABLE_ROLES


def ensure_staff_admin_can_manage_user(ctx: AuthContext, role: str) -> None:
    if ctx.role == UserRole.ADMIN_STAFF.value and role not in STAFF_MANAGEABLE_ROLES:
        raise ProfileForbiddenError()


async def can_view_user_profile(
    session: AsyncSession,
    ctx: AuthContext,
    target_user_id: UUID,
) -> bool:
    if str(target_user_id) == ctx.user_id:
        return True
    if ctx.role in UNRESTRICTED_ROLES or ctx.role == UserRole.ADMIN_STAFF.value:
        return True
    if ctx.role == UserRole.MANAGER.value:
        return await _user_in_manager_blocks(session, UUID(ctx.user_id), target_user_id)
    if ctx.role in SELLER_ROLES:
        return False
    return False


async def ensure_can_view_user_profile(
    session: AsyncSession,
    ctx: AuthContext,
    target_user_id: UUID,
) -> None:
    if not await can_view_user_profile(session, ctx, target_user_id):
        raise ProfileForbiddenError()


async def _user_in_manager_blocks(
    session: AsyncSession,
    manager_id: UUID,
    target_user_id: UUID,
) -> bool:
    block_ids_result = await session.execute(
        select(ManagerBlockModel.block_id).where(ManagerBlockModel.manager_id == manager_id)
    )
    block_ids = [row[0] for row in block_ids_result.all()]
    if not block_ids:
        return False

    member_result = await session.execute(
        select(BlockMemberModel.id)
        .where(
            BlockMemberModel.user_id == target_user_id,
            BlockMemberModel.block_id.in_(block_ids),
        )
        .limit(1)
    )
    if member_result.scalar_one_or_none() is not None:
        return True

    location_result = await session.execute(
        select(BlockLocationModel.id)
        .join(
            BlockMemberModel,
            BlockMemberModel.block_id == BlockLocationModel.block_id,
        )
        .where(
            BlockMemberModel.user_id == target_user_id,
            BlockLocationModel.block_id.in_(block_ids),
        )
        .limit(1)
    )
    return location_result.scalar_one_or_none() is not None


async def can_view_location(
    session: AsyncSession,
    ctx: AuthContext,
    location_id: int,
) -> bool:
    if ctx.role in UNRESTRICTED_ROLES or ctx.role == UserRole.ADMIN_STAFF.value:
        return True
    if ctx.role == UserRole.MANAGER.value:
        result = await session.execute(
            select(ManagerBlockModel.id)
            .join(
                BlockLocationModel,
                BlockLocationModel.block_id == ManagerBlockModel.block_id,
            )
            .where(
                ManagerBlockModel.manager_id == UUID(ctx.user_id),
                BlockLocationModel.location_id == location_id,
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None
    return False


async def ensure_can_view_location(
    session: AsyncSession,
    ctx: AuthContext,
    location_id: int,
) -> None:
    if not await can_view_location(session, ctx, location_id):
        raise ProfileForbiddenError()
