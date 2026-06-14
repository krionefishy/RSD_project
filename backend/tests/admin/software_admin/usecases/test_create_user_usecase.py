import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.software_admin.usecases.create_user_usecase import CreateUserUseCase
from app.users.db_models import UserRole
from app.users.domain import UserCreate
from tests.builder import Builder
from tests.mocks import MockPasswordService


class TestCreateUserUseCase:
    async def test_creates_user_with_password(
        self,
        db_session: AsyncSession,
    ) -> None:
        password_service = MockPasswordService()
        usecase = CreateUserUseCase(db_session, password_service)
        request = UserCreate(
            external_system_id="new_user_001",
            password="secure_password_123",
            role=UserRole.SELLER,
            first_name="John",
            last_name="Doe",
            phone="+7-999-123-45-67",
            position="Manager",
        )

        result = await usecase.execute(request)

        assert result is not None
        assert result.user.external_system_id == "new_user_001"
        assert result.user.role == "seller"
        assert result.user.first_name == "John"
        assert result.temp_password is not None

    async def test_raises_when_external_id_exists(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        await builder.build_user(
            external_system_id="existing_user_001",
            first_name="Existing",
            role=UserRole.SELLER,
        )
        password_service = MockPasswordService()
        usecase = CreateUserUseCase(db_session, password_service)
        request = UserCreate(
            external_system_id="existing_user_001",
            password="secure_password_123",
            role=UserRole.MANAGER,
        )

        with pytest.raises(HTTPException) as exc_info:
            await usecase.execute(request)

        assert exc_info.value.status_code == 409
