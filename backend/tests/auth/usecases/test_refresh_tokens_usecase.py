import time
from uuid import uuid4

import pytest
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.domain import RefreshRequest
from app.auth.dto import TokenPairDTO
from app.auth.errors import AccountInactiveError, RefreshInvalidError, TokenExpiredError, TokenInvalidError
from app.auth.tokens import create_refresh_token, decode_token
from app.auth.usecases.refresh_tokens_usecase import RefreshTokensUseCase
from app.users.db_models import UserRole
from shared.settings.config import Settings
from tests.builder import Builder
from tests.mocks import MockRefreshTokenStore


class TestRefreshTokensUseCase:
    async def test_returns_new_token_pair_when_refresh_valid(
        self,
        db_session: AsyncSession,
        builder: Builder,
        settings: Settings,
    ) -> None:
        user = await builder.build_user(
            external_system_id="refresh_user_001",
            role=UserRole.SELLER,
        )
        refresh_store = MockRefreshTokenStore()
        old_refresh, old_jti, _ = create_refresh_token(settings, user.id, user.role)
        await refresh_store.save(user.id, old_jti)
        usecase = RefreshTokensUseCase(db_session, refresh_store, settings)

        result = await usecase.execute(RefreshRequest(refresh_token=old_refresh))

        assert isinstance(result, TokenPairDTO)
        assert result.user_id == user.id
        assert result.role == "seller"
        assert result.token_type == "bearer"
        new_payload = decode_token(settings, result.refresh_token, expected_type="refresh")
        assert new_payload["jti"] != old_jti
        assert await refresh_store.exists(user.id, new_payload["jti"])
        assert not await refresh_store.exists(user.id, old_jti)

    async def test_raises_token_invalid_when_token_malformed(
        self,
        db_session: AsyncSession,
        settings: Settings,
    ) -> None:
        refresh_store = MockRefreshTokenStore()
        usecase = RefreshTokensUseCase(db_session, refresh_store, settings)

        with pytest.raises(TokenInvalidError):
            await usecase.execute(RefreshRequest(refresh_token="not-a-valid-jwt"))

    async def test_raises_token_expired_when_token_expired(
        self,
        db_session: AsyncSession,
        builder: Builder,
        settings: Settings,
    ) -> None:
        user = await builder.build_user(external_system_id="refresh_user_002")
        now = int(time.time())
        payload = {
            "sub": str(user.id),
            "role": user.role,
            "type": "refresh",
            "jti": "expired_jti",
            "iat": now - 7200,
            "exp": now - 3600,
        }
        expired_token = jwt.encode(
            payload,
            settings.jwt.secret,
            algorithm=settings.jwt.algorithm,
        )
        refresh_store = MockRefreshTokenStore()
        await refresh_store.save(user.id, "expired_jti")
        usecase = RefreshTokensUseCase(db_session, refresh_store, settings)

        with pytest.raises(TokenExpiredError):
            await usecase.execute(RefreshRequest(refresh_token=expired_token))

    async def test_raises_refresh_invalid_when_token_not_in_store(
        self,
        db_session: AsyncSession,
        builder: Builder,
        settings: Settings,
    ) -> None:
        user = await builder.build_user(external_system_id="refresh_user_003")
        refresh_token, jti, _ = create_refresh_token(settings, user.id, user.role)
        refresh_store = MockRefreshTokenStore()
        usecase = RefreshTokensUseCase(db_session, refresh_store, settings)

        with pytest.raises(RefreshInvalidError):
            await usecase.execute(RefreshRequest(refresh_token=refresh_token))

        assert user.id in refresh_store._deleted_users
        assert not await refresh_store.exists(user.id, jti)

    async def test_raises_refresh_invalid_when_user_deleted(
        self,
        db_session: AsyncSession,
        settings: Settings,
    ) -> None:
        user_id = uuid4()
        refresh_token, jti, _ = create_refresh_token(settings, user_id, UserRole.SELLER)
        refresh_store = MockRefreshTokenStore()
        await refresh_store.save(user_id, jti)
        usecase = RefreshTokensUseCase(db_session, refresh_store, settings)

        with pytest.raises(RefreshInvalidError):
            await usecase.execute(RefreshRequest(refresh_token=refresh_token))

        assert user_id in refresh_store._deleted_users

    async def test_raises_account_inactive_when_user_is_inactive(
        self,
        db_session: AsyncSession,
        builder: Builder,
        settings: Settings,
    ) -> None:
        user = await builder.build_user(
            external_system_id="refresh_user_inactive",
            role=UserRole.SELLER,
            is_active=False,
        )
        refresh_store = MockRefreshTokenStore()
        refresh_token, jti, _ = create_refresh_token(settings, user.id, user.role)
        await refresh_store.save(user.id, jti)
        usecase = RefreshTokensUseCase(db_session, refresh_store, settings)

        with pytest.raises(AccountInactiveError):
            await usecase.execute(RefreshRequest(refresh_token=refresh_token))

        assert user.id in refresh_store._deleted_users
        assert not await refresh_store.exists(user.id, jti)
