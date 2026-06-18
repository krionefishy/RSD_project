"""Tests for manager-scoped block and location listing."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.super_admin.usecases.block_usecases import ListBlocksUseCase
from app.admin.super_admin.usecases.location_usecases import ListLocationsUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestListBlocksManagerScope:
    async def test_manager_sees_only_own_blocks(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.build_user(external_system_id="mgr_scope_b1", role=UserRole.MANAGER)
        block = await builder.build_block(name="Manager Scope Block 1")
        await builder.build_manager_block(manager=manager, block=block)

        other_block = await builder.build_block(name="Other Block Scope 1")

        ctx = builder.auth_context_for(manager)
        result = await ListBlocksUseCase(db_session).execute(ctx)

        block_ids = {item.id for item in result.items}
        assert block.id in block_ids
        assert other_block.id not in block_ids

    async def test_admin_staff_sees_all_blocks(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.build_user(external_system_id="admin_scope_b1", role=UserRole.ADMIN_STAFF)
        block1 = await builder.build_block(name="Admin Scope Block 1")
        block2 = await builder.build_block(name="Admin Scope Block 2")

        ctx = builder.auth_context_for(admin)
        result = await ListBlocksUseCase(db_session).execute(ctx)

        block_ids = {item.id for item in result.items}
        assert block1.id in block_ids
        assert block2.id in block_ids

    async def test_manager_sees_only_own_locations(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.build_user(external_system_id="mgr_scope_loc1", role=UserRole.MANAGER)
        block = await builder.build_block(name="Block For Loc Scope")
        await builder.build_manager_block(manager=manager, block=block)

        location_in_block = await builder.build_location(name="Loc In Block Scope", code="LIBS1")
        await builder.build_block_location(block=block, location=location_in_block)

        other_block = await builder.build_block(name="Other Block Loc Scope")
        other_location = await builder.build_location(name="Other Loc Scope", code="OLS1")
        await builder.build_block_location(block=other_block, location=other_location)

        ctx = builder.auth_context_for(manager)
        result = await ListLocationsUseCase(db_session).execute(ctx)

        location_ids = {item.id for item in result.items}
        assert location_in_block.id in location_ids
        assert other_location.id not in location_ids
