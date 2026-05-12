from __future__ import annotations

from datetime import datetime
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.db_models import UserRole
from app.users.dto import UserDTO
from app.users.usecases.get_user_usecase import GetUserUseCase
from tests.builder import Builder


class TestGetUserUseCase:
    async def test_returns_user_dto_when_user_exists(
        self,
        db_session: AsyncSession,
        builder: Builder,
        frozen_datetime: datetime,
    ) -> None:
        user = await builder.build_user(
            external_system_id="test_user_123",
            first_name="John",
            last_name="Doe",
            phone="+7-999-123-45-67",
            position="Sales Manager",
            role=UserRole.SELLER,
            is_active=True,
        )

        usecase = GetUserUseCase(db_session)
        result = await usecase.execute(user.id)

        assert result is not None
        assert isinstance(result, UserDTO)
        assert result.id == user.id
        assert result.external_system_id == "test_user_123"
        assert result.first_name == "John"
        assert result.last_name == "Doe"
        assert result.name == "John Doe"
        assert result.phone == "+7-999-123-45-67"
        assert result.position == "Sales Manager"
        assert result.role == "seller"
        assert result.is_active is True

    async def test_returns_none_when_user_not_exists(
        self,
        db_session: AsyncSession,
    ) -> None:
        non_existent_id = uuid4()

        usecase = GetUserUseCase(db_session)
        result = await usecase.execute(non_existent_id)

        assert result is None

    async def test_returns_user_with_location(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user, location, _ = await builder.build_user_with_location(
            user_kwargs={
                "external_system_id": "user_with_location",
                "first_name": "Alice",
                "last_name": "",
            },
            location_kwargs={
                "code": "OFFICE_001",
                "name": "Main Office",
                "address": "123 Main St",
            },
        )

        usecase = GetUserUseCase(db_session)
        result = await usecase.execute(user.id)

        assert result is not None
        assert result.name == "Alice"
        assert result.location is not None
        assert result.location.id == location.id
        assert result.location.name == "Main Office"

    async def test_returns_user_with_managed_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager, block, _ = await builder.build_manager_with_block(
            user_kwargs={
                "external_system_id": "manager_001",
                "first_name": "Bob",
                "last_name": "Manager",
                "role": UserRole.MANAGER,
            },
            block_kwargs={
                "name": "Block A",
                "description": "First sales block",
            },
        )

        usecase = GetUserUseCase(db_session)
        result = await usecase.execute(manager.id)

        assert result is not None
        assert result.name == "Bob Manager"
        assert result.role == "manager"
        assert result.managed_block is not None
        assert result.managed_block.id == block.id
        assert result.managed_block.name == "Block A"

    async def test_returns_seller_without_managed_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="seller_001",
            first_name="Charlie",
            role=UserRole.SELLER,
        )

        usecase = GetUserUseCase(db_session)
        result = await usecase.execute(seller.id)

        assert result is not None
        assert result.role == "seller"
        assert result.managed_block is None

    async def test_returns_user_without_location(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="no_location_user",
            first_name="Dave",
        )

        usecase = GetUserUseCase(db_session)
        result = await usecase.execute(user.id)

        assert result is not None
        assert result.location is None

    async def test_returns_user_with_full_profile(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="full_profile_user",
            first_name="Eve",
            last_name="Complete",
            phone="+7-999-999-99-99",
            position="Senior Manager",
            avatar_url="https://example.com/avatar.jpg",
            role=UserRole.ADMIN_SALES,
            is_active=True,
            is_temp_password=False,
        )

        usecase = GetUserUseCase(db_session)
        result = await usecase.execute(user.id)

        assert result is not None
        assert result.external_system_id == "full_profile_user"
        assert result.first_name == "Eve"
        assert result.last_name == "Complete"
        assert result.name == "Eve Complete"
        assert result.phone == "+7-999-999-99-99"
        assert result.position == "Senior Manager"
        assert result.avatar_url == "https://example.com/avatar.jpg"
        assert result.role == "admin_sales"
        assert result.is_active is True
        assert result.is_temp_password is False

    async def test_returns_inactive_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="inactive_user",
            first_name="Frank",
            is_active=False,
        )

        usecase = GetUserUseCase(db_session)
        result = await usecase.execute(user.id)

        assert result is not None
        assert result.is_active is False

    async def test_returns_user_with_temp_password(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="temp_pass_user",
            first_name="Grace",
            is_temp_password=True,
        )

        usecase = GetUserUseCase(db_session)
        result = await usecase.execute(user.id)

        assert result is not None
        assert result.is_temp_password is True
