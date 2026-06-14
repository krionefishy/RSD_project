import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.profiles.change_employee_position_usecase import (
    ChangeEmployeePositionUseCase,
)
from app.personnel.domain import ChangeEmployeePositionRequest
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError
from tests.builder import Builder


class TestChangeEmployeePositionUseCase:
    async def test_updates_position(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="change_position_user")
        ctx = builder.auth_context_for(admin)

        result = await ChangeEmployeePositionUseCase(db_session).execute(
            seller.id,
            ChangeEmployeePositionRequest(position="Старший продавец"),
            ctx,
        )

        assert result.position == "Старший продавец"

    async def test_raises_conflict_for_non_seller_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        manager = await builder.build_user(
            external_system_id="manager_not_seller",
            role=UserRole.MANAGER,
        )
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileConflictError):
            await ChangeEmployeePositionUseCase(db_session).execute(
                manager.id,
                ChangeEmployeePositionRequest(position="Продавец"),
                ctx,
            )

    async def test_raises_validation_for_empty_position(
        self,
        builder: Builder,
    ) -> None:
        with pytest.raises(ValidationError):
            ChangeEmployeePositionRequest(position="   ")

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await ChangeEmployeePositionUseCase(db_session).execute(
                seller.id,
                ChangeEmployeePositionRequest(position="Продавец"),
                ctx,
            )
