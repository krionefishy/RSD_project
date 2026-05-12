from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.software_admin.usecases.assign_manager_block_usecase import AssignManagerBlockUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestAssignManagerBlockUseCase:
    async def test_assigns_block_to_manager(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager, _, _ = await builder.build_manager_with_block(
            user_kwargs={
                "external_system_id": "manager_assign_test",
                "first_name": "John",
            },
        )
        new_block = await builder.build_block(name="New Block")
        usecase = AssignManagerBlockUseCase(db_session)

        result = await usecase.execute(manager.id, new_block.id)

        assert result is not None
        assert result.manager_id == manager.id
        assert result.block_id == new_block.id

    async def test_returns_none_for_nonexistent_manager(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        block = await builder.build_block(name="Test Block")
        usecase = AssignManagerBlockUseCase(db_session)

        result = await usecase.execute(uuid4(), block.id)

        assert result is None

    async def test_returns_none_when_user_is_not_manager(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="seller_not_manager",
            first_name="John",
            role=UserRole.SELLER,
        )
        block = await builder.build_block(name="Test Block")
        usecase = AssignManagerBlockUseCase(db_session)

        result = await usecase.execute(seller.id, block.id)

        assert result is None

    async def test_returns_none_for_nonexistent_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager, _, _ = await builder.build_manager_with_block(
            user_kwargs={
                "external_system_id": "manager_no_block_test",
                "first_name": "Jane",
            },
        )
        usecase = AssignManagerBlockUseCase(db_session)

        result = await usecase.execute(manager.id, 99999)

        assert result is None
