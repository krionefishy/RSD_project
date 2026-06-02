from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.software_admin.usecases.remove_user_block_usecase import RemoveUserBlockUseCase
from app.locations.db_models import BlockMemberStatus
from app.users.db_models import UserRole
from tests.builder import Builder


class TestRemoveUserBlockUseCase:
    async def test_removes_block_from_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="remove_block_test",
            first_name="John",
            role=UserRole.SELLER,
        )
        block = await builder.build_block(name="Block to Remove")
        assign_usecase = None
        from app.admin.software_admin.usecases.assign_user_block_usecase import AssignUserBlockUseCase
        assign_usecase = AssignUserBlockUseCase(db_session)
        await assign_usecase.execute(user.id, block.id)
        usecase = RemoveUserBlockUseCase(db_session)

        result = await usecase.execute(user.id)

        assert result is True

    async def test_returns_none_for_nonexistent_user(
        self,
        db_session: AsyncSession,
    ) -> None:
        usecase = RemoveUserBlockUseCase(db_session)

        result = await usecase.execute(uuid4())

        assert result is None

    async def test_returns_false_when_user_has_no_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="no_block_to_remove",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        usecase = RemoveUserBlockUseCase(db_session)

        result = await usecase.execute(user.id)

        assert result is False
