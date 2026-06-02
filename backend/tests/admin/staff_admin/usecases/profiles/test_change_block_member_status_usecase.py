from __future__ import annotations

import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.profiles.change_block_member_status_usecase import (
    ChangeBlockMemberStatusUseCase,
)
from app.locations.db_models import BlockMemberStatus
from app.personnel.domain import ChangeBlockMemberStatusRequest
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder


class TestChangeBlockMemberStatusUseCase:
    async def test_changes_status_to_reserve(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        block = await builder.default_block
        member = await builder.build_user(external_system_id="status_change_user")
        await builder.build_block_member(user=member, block=block, status=BlockMemberStatus.PRIMARY.value)
        ctx = builder.auth_context_for(admin)

        result = await ChangeBlockMemberStatusUseCase(db_session).execute(
            member.id,
            ChangeBlockMemberStatusRequest(block_id=block.id, status="reserve"),
            ctx,
        )

        assert result.block_member_status == "reserve"

    async def test_raises_not_found_when_membership_missing(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="no_membership_user")
        block = await builder.build_block(name="Other Block")
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileNotFoundError):
            await ChangeBlockMemberStatusUseCase(db_session).execute(
                seller.id,
                ChangeBlockMemberStatusRequest(block_id=block.id, status="primary"),
                ctx,
            )

    async def test_raises_validation_for_invalid_status(
        self,
        builder: Builder,
    ) -> None:
        with pytest.raises(ValidationError):
            ChangeBlockMemberStatusRequest(block_id=1, status="invalid")

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await ChangeBlockMemberStatusUseCase(db_session).execute(
                seller.id,
                ChangeBlockMemberStatusRequest(block_id=1, status="primary"),
                ctx,
            )
