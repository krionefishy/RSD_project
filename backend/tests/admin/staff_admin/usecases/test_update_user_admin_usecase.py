from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.update_user_admin_usecase import UpdateUserAdminUseCase
from app.locations.db_models import BlockMemberStatus
from app.users.db_models import UserRole
from app.users.domain import UserAdminUpdate
from tests.builder import Builder


class TestUpdateUserAdminUseCase:
    async def test_updates_user_profile(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="update_user",
            first_name="John",
            last_name="Doe",
            phone="+7-999-123-45-67",
            position="Manager",
            role=UserRole.SELLER,
        )
        request = UserAdminUpdate(
            first_name="Jane",
            last_name="Smith",
            phone="+7-999-999-99-99",
            position="Director",
        )
        usecase = UpdateUserAdminUseCase(db_session)

        result = await usecase.execute(user.id, request)

        assert result is not None
        assert result.first_name == "Jane"
        assert result.last_name == "Smith"
        assert result.phone == "+7-999-999-99-99"
        assert result.position == "Director"

    async def test_returns_none_for_nonexistent_user(
        self,
        db_session: AsyncSession,
    ) -> None:
        request = UserAdminUpdate(first_name="New Name")
        usecase = UpdateUserAdminUseCase(db_session)

        result = await usecase.execute(uuid4(), request)

        assert result is None

    async def test_partial_update_only_provided_fields(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="partial_update_user",
            first_name="John",
            last_name="Doe",
            phone="+7-999-123-45-67",
            position="Manager",
            role=UserRole.SELLER,
        )
        request = UserAdminUpdate(first_name="Jane")
        usecase = UpdateUserAdminUseCase(db_session)

        result = await usecase.execute(user.id, request)

        assert result is not None
        assert result.first_name == "Jane"
        assert result.last_name == "Doe"
        assert result.phone == "+7-999-123-45-67"
