from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.software_admin.usecases.assign_user_block_usecase import AssignUserBlockUseCase
from app.locations.db_models import BlockMemberStatus
from app.users.db_models import UserRole
from tests.builder import Builder


class TestAssignUserBlockUseCase:
    async def test_assigns_block_to_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="user_block_test",
            first_name="John",
            role=UserRole.SELLER,
        )
        block = await builder.build_block(name="User Block")
        usecase = AssignUserBlockUseCase(db_session)

        result = await usecase.execute(user.id, block.id)

        assert result is not None
        assert result.user_id == user.id
        assert result.block_id == block.id
        assert result.status == BlockMemberStatus.PRIMARY.value

    async def test_updates_existing_membership(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="update_membership_test",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        old_block = await builder.build_block(name="Old Block")
        new_block = await builder.build_block(name="New Block")
        usecase = AssignUserBlockUseCase(db_session)
        await usecase.execute(user.id, old_block.id)

        result = await usecase.execute(user.id, new_block.id)

        assert result is not None
        assert result.block_id == new_block.id

    async def test_returns_none_for_nonexistent_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        block = await builder.build_block(name="Test Block")
        usecase = AssignUserBlockUseCase(db_session)

        result = await usecase.execute(uuid4(), block.id)

        assert result is None

    async def test_returns_none_for_nonexistent_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="no_block_test",
            first_name="John",
            role=UserRole.SELLER,
        )
        usecase = AssignUserBlockUseCase(db_session)

        result = await usecase.execute(user.id, 99999)

        assert result is None
