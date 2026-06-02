from __future__ import annotations

import time

from jose import jwt

from app.auth.domain import LogoutRequest
from app.auth.tokens import create_refresh_token
from app.auth.usecases.logout_user_usecase import LogoutUserUseCase
from app.users.db_models import UserRole
from shared.settings.config import Settings
from tests.builder import Builder
from tests.mocks import MockRefreshTokenStore


class TestLogoutUserUseCase:
    async def test_deletes_refresh_token_when_token_valid(
        self,
        builder: Builder,
        settings: Settings,
    ) -> None:
        user = await builder.build_user(
            external_system_id="logout_user_001",
            role=UserRole.SELLER,
        )
        refresh_store = MockRefreshTokenStore()
        refresh_token, jti, _ = create_refresh_token(settings, user.id, user.role)
        await refresh_store.save(user.id, jti)
        usecase = LogoutUserUseCase(refresh_store, settings)

        await usecase.execute(LogoutRequest(refresh_token=refresh_token))

        assert not await refresh_store.exists(user.id, jti)

    async def test_does_nothing_when_token_invalid(
        self,
        settings: Settings,
    ) -> None:
        refresh_store = MockRefreshTokenStore()
        usecase = LogoutUserUseCase(refresh_store, settings)

        await usecase.execute(LogoutRequest(refresh_token="invalid-token"))

        assert refresh_store._tokens == {}

    async def test_does_nothing_when_token_expired(
        self,
        builder: Builder,
        settings: Settings,
    ) -> None:
        user = await builder.build_user(external_system_id="logout_user_002")
        now = int(time.time())
        payload = {
            "sub": str(user.id),
            "role": user.role,
            "type": "refresh",
            "jti": "logout_expired_jti",
            "iat": now - 7200,
            "exp": now - 3600,
        }
        expired_token = jwt.encode(
            payload,
            settings.jwt.secret,
            algorithm=settings.jwt.algorithm,
        )
        refresh_store = MockRefreshTokenStore()
        await refresh_store.save(user.id, "logout_expired_jti")
        usecase = LogoutUserUseCase(refresh_store, settings)

        await usecase.execute(LogoutRequest(refresh_token=expired_token))

        assert await refresh_store.exists(user.id, "logout_expired_jti")
