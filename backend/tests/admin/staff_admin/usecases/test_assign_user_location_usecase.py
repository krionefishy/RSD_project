from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.assign_user_location_usecase import AssignUserLocationUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestAssignUserLocationUseCase:
    async def test_assigns_location_to_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="assign_loc_user",
            first_name="John",
            role=UserRole.SELLER,
        )
        location = await builder.build_location(
            code="LOC001",
            name="Main Office",
            address="123 Main St",
        )
        usecase = AssignUserLocationUseCase(db_session)

        result = await usecase.execute(user.id, location.id)

        assert result is not None
        assert result.user_id == user.id
        assert result.location_id == location.id

    async def test_updates_existing_assignment(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user, old_location, _ = await builder.build_user_with_location(
            user_kwargs={
                "external_system_id": "update_loc_user",
                "first_name": "John",
                "role": UserRole.SELLER,
            },
        )
        new_location = await builder.build_location(
            code="LOC002",
            name="Second Office",
            address="456 Second St",
        )
        usecase = AssignUserLocationUseCase(db_session)

        result = await usecase.execute(user.id, new_location.id)

        assert result is not None
        assert result.location_id == new_location.id

    async def test_returns_none_for_nonexistent_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        location = await builder.build_location(
            code="LOC003",
            name="Third Office",
            address="789 Third St",
        )
        usecase = AssignUserLocationUseCase(db_session)

        result = await usecase.execute(uuid4(), location.id)

        assert result is None

    async def test_returns_none_for_nonexistent_location(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="no_loc_user",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        usecase = AssignUserLocationUseCase(db_session)

        result = await usecase.execute(user.id, 99999)

        assert result is None
