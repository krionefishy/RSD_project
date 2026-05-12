from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Self
from uuid import UUID, uuid4

from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.locations.db_models import (
    BlockLocationModel,
    BlockModel,
    LocationModel,
    ManagerBlockModel,
    UserLocationModel,
)
from app.users.db_models import UserModel, UserRole


class Builder:
    def __init__(self, session: AsyncSession, default_datetime: datetime) -> None:
        self._session = session
        self._default_datetime = default_datetime

        self.__user: UserModel | None = None
        self.__location: LocationModel | None = None
        self.__block: BlockModel | None = None

    @property
    async def default_user(self) -> UserModel:
        if self.__user is None:
            self.__user = await self.build_user()
        return self.__user

    @property
    async def default_location(self) -> LocationModel:
        if self.__location is None:
            self.__location = await self.build_location(
                code="MAIN001",
                name="Main Office",
                address="123 Main Street, Moscow",
            )
        return self.__location

    @property
    async def default_block(self) -> BlockModel:
        if self.__block is None:
            self.__block = await self.build_block(name="Default Block")
        return self.__block

    def with_user(self, user: UserModel) -> Self:
        self.__user = user
        return self

    def with_location(self, location: LocationModel) -> Self:
        self.__location = location
        return self

    def with_block(self, block: BlockModel) -> Self:
        self.__block = block
        return self

    async def build_user(
        self,
        *,
        user_id: UUID | None = None,
        external_system_id: str = "test_user_001",
        hashed_password: str = "hashed_password_123",
        role: UserRole = UserRole.SELLER,
        first_name: str | None = "John",
        last_name: str | None = "Doe",
        phone: str | None = "+7-999-123-45-67",
        position: str | None = "Sales Manager",
        avatar_url: str | None = "https://example.com/avatar.jpg",
        is_active: bool = True,
        is_temp_password: bool = False,
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> UserModel:
        statement = (
            insert(UserModel)
            .values(
                id=user_id or uuid4(),
                external_system_id=external_system_id,
                hashed_password=hashed_password,
                role=role,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                position=position,
                avatar_url=avatar_url,
                is_active=is_active,
                is_temp_password=is_temp_password,
                created_at=created_at or self._default_datetime,
                updated_at=updated_at or self._default_datetime,
            )
            .returning(UserModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_location(
        self,
        *,
        location_id: int | None = None,
        code: str = "LOC001",
        name: str = "Test Location",
        address: str = "Test Address 123",
        city: str | None = "Moscow",
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> LocationModel:
        values = {
            "code": code,
            "name": name,
            "address": address,
            "city": city,
            "created_at": created_at or self._default_datetime,
            "updated_at": updated_at or self._default_datetime,
        }
        if location_id is not None:
            values["id"] = location_id
        statement = insert(LocationModel).values(**values).returning(LocationModel)
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_block(
        self,
        *,
        block_id: int | None = None,
        name: str = "Test Block",
        description: str | None = "Test block description",
        created_at: datetime | None = None,
        updated_at: datetime | None = None,
    ) -> BlockModel:
        values = {
            "name": name,
            "description": description,
            "created_at": created_at or self._default_datetime,
            "updated_at": updated_at or self._default_datetime,
        }
        if block_id is not None:
            values["id"] = block_id
        statement = insert(BlockModel).values(**values).returning(BlockModel)
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_manager_block(
        self,
        *,
        manager: UserModel | None = None,
        block: BlockModel | None = None,
        assigned_at: datetime | None = None,
    ) -> ManagerBlockModel:
        manager_obj = manager or await self.default_user
        block_obj = block or await self.default_block

        statement = (
            insert(ManagerBlockModel)
            .values(
                manager_id=manager_obj.id,
                block_id=block_obj.id,
                assigned_at=assigned_at or self._default_datetime,
            )
            .returning(ManagerBlockModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_user_location(
        self,
        *,
        user: UserModel | None = None,
        location: LocationModel | None = None,
        assigned_at: datetime | None = None,
    ) -> UserLocationModel:
        user_obj = user or await self.default_user
        location_obj = location or await self.default_location

        statement = (
            insert(UserLocationModel)
            .values(
                user_id=user_obj.id,
                location_id=location_obj.id,
                assigned_at=assigned_at or self._default_datetime,
            )
            .returning(UserLocationModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_block_location(
        self,
        *,
        block: BlockModel | None = None,
        location: LocationModel | None = None,
        assigned_at: datetime | None = None,
    ) -> BlockLocationModel:
        block_obj = block or await self.default_block
        location_obj = location or await self.default_location

        statement = (
            insert(BlockLocationModel)
            .values(
                block_id=block_obj.id,
                location_id=location_obj.id,
                assigned_at=assigned_at or self._default_datetime,
            )
            .returning(BlockLocationModel)
        )
        result = await self._session.execute(statement)
        return result.scalar_one()

    async def build_manager_with_block(
        self,
        *,
        user_kwargs: dict[str, Any] | None = None,
        block_kwargs: dict[str, Any] | None = None,
    ) -> tuple[UserModel, BlockModel, ManagerBlockModel]:
        merged_kwargs = {"role": UserRole.MANAGER}
        if user_kwargs:
            merged_kwargs.update(user_kwargs)
        user = await self.build_user(**merged_kwargs)
        block = await self.build_block(**(block_kwargs or {}))
        assignment = await self.build_manager_block(manager=user, block=block)
        return user, block, assignment

    async def build_user_with_location(
        self,
        *,
        user_kwargs: dict[str, Any] | None = None,
        location_kwargs: dict[str, Any] | None = None,
    ) -> tuple[UserModel, LocationModel, UserLocationModel]:
        user = await self.build_user(**(user_kwargs or {}))
        location = await self.build_location(**(location_kwargs or {}))
        assignment = await self.build_user_location(user=user, location=location)
        return user, location, assignment
