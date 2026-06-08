from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.domain import LoginRequest
from app.auth.dto import TokenPairDTO
from app.auth.errors import AccountInactiveError, DecryptFailedError, InvalidCredentialsError
from app.auth.password import DecryptError
from app.auth.tokens import decode_token
from app.auth.usecases.login_user_usecase import LoginUserUseCase
from app.users.db_models import UserRole
from shared.settings.config import Settings
from tests.builder import Builder
from tests.mocks import MockPasswordService, MockRefreshTokenStore


class FailingPasswordService(MockPasswordService):
    def decrypt(self, encrypted: str) -> str:
        raise DecryptError("decrypt failed")


class TestLoginUserUseCase:
    async def test_returns_token_pair_when_credentials_valid(
        self,
        db_session: AsyncSession,
        builder: Builder,
        settings: Settings,
    ) -> None:
        password_service = MockPasswordService()
        refresh_store = MockRefreshTokenStore()
        raw_password = "secret123"
        hashed = password_service.hash(raw_password)
        user = await builder.build_user(
            external_system_id="login_user_001",
            hashed_password=hashed,
            role=UserRole.SELLER,
        )
        usecase = LoginUserUseCase(db_session, password_service, refresh_store, settings)

        result = await usecase.execute(
            LoginRequest(
                external_system_id="login_user_001",
                encrypted_password=raw_password,
            )
        )

        assert isinstance(result, TokenPairDTO)
        assert result.token_type == "bearer"
        assert result.user_id == user.id
        assert result.role == "seller"
        assert result.expires_in == settings.jwt.access_expire_seconds
        access_payload = decode_token(settings, result.access_token, expected_type="access")
        refresh_payload = decode_token(settings, result.refresh_token, expected_type="refresh")
        assert access_payload["sub"] == str(user.id)
        assert refresh_payload["sub"] == str(user.id)
        assert refresh_payload["jti"] is not None
        assert await refresh_store.exists(user.id, refresh_payload["jti"])

    async def test_raises_invalid_credentials_when_user_not_found(
        self,
        db_session: AsyncSession,
        settings: Settings,
    ) -> None:
        password_service = MockPasswordService()
        refresh_store = MockRefreshTokenStore()
        usecase = LoginUserUseCase(db_session, password_service, refresh_store, settings)

        with pytest.raises(InvalidCredentialsError):
            await usecase.execute(
                LoginRequest(
                    external_system_id="nonexistent_user",
                    encrypted_password="any_password",
                )
            )

    async def test_raises_invalid_credentials_when_password_wrong(
        self,
        db_session: AsyncSession,
        builder: Builder,
        settings: Settings,
    ) -> None:
        password_service = MockPasswordService()
        refresh_store = MockRefreshTokenStore()
        hashed = password_service.hash("correct_password")
        await builder.build_user(
            external_system_id="login_user_002",
            hashed_password=hashed,
        )
        usecase = LoginUserUseCase(db_session, password_service, refresh_store, settings)

        with pytest.raises(InvalidCredentialsError):
            await usecase.execute(
                LoginRequest(
                    external_system_id="login_user_002",
                    encrypted_password="wrong_password",
                )
            )

    async def test_raises_decrypt_failed_when_decrypt_fails(
        self,
        db_session: AsyncSession,
        builder: Builder,
        settings: Settings,
    ) -> None:
        password_service = FailingPasswordService()
        refresh_store = MockRefreshTokenStore()
        await builder.build_user(external_system_id="login_user_003")
        usecase = LoginUserUseCase(db_session, password_service, refresh_store, settings)

        with pytest.raises(DecryptFailedError):
            await usecase.execute(
                LoginRequest(
                    external_system_id="login_user_003",
                    encrypted_password="encrypted",
                )
            )

    async def test_raises_account_inactive_when_user_is_inactive(
        self,
        db_session: AsyncSession,
        builder: Builder,
        settings: Settings,
    ) -> None:
        password_service = MockPasswordService()
        refresh_store = MockRefreshTokenStore()
        raw_password = "secret123"
        hashed = password_service.hash(raw_password)
        user = await builder.build_user(
            external_system_id="login_user_inactive",
            hashed_password=hashed,
            is_active=False,
        )
        usecase = LoginUserUseCase(db_session, password_service, refresh_store, settings)

        with pytest.raises(AccountInactiveError):
            await usecase.execute(
                LoginRequest(
                    external_system_id="login_user_inactive",
                    encrypted_password=raw_password,
                )
            )

        assert refresh_store._tokens == {}
        assert user.id not in refresh_store._deleted_users
