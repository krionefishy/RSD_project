from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.remove_user_location_usecase import RemoveUserLocationUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestRemoveUserLocationUseCase:
    async def test_removes_location_from_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user, _, _ = await builder.build_user_with_location(
            user_kwargs={
                "external_system_id": "remove_loc_user",
                "first_name": "John",
                "role": UserRole.SELLER,
            },
        )
        usecase = RemoveUserLocationUseCase(db_session)

        result = await usecase.execute(user.id)

        assert result is True

    async def test_returns_none_for_nonexistent_user(
        self,
        db_session: AsyncSession,
    ) -> None:
        usecase = RemoveUserLocationUseCase(db_session)

        result = await usecase.execute(uuid4())

        assert result is None

    async def test_returns_false_when_user_has_no_location(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="no_loc_user",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        usecase = RemoveUserLocationUseCase(db_session)

        result = await usecase.execute(user.id)

        assert result is False
