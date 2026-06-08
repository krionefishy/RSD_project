from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder
from tests.mocks import MockPasswordService


class TestPostAuthLogin:
    async def test_returns_200_when_credentials_valid(
        self,
        client: AsyncClient,
        builder: Builder,
        password_service: MockPasswordService,
    ) -> None:
        raw_password = "secret123"
        hashed = password_service.hash(raw_password)
        await builder.build_user(
            external_system_id="api_login_001",
            hashed_password=hashed,
        )

        response = await client.post(
            "/api/v1/auth/login",
            json={
                "external_system_id": "api_login_001",
                "encrypted_password": raw_password,
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["token_type"] == "bearer"
        assert body["access_token"]
        assert body["refresh_token"]

    async def test_returns_401_when_user_not_found(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "external_system_id": "nonexistent_user",
                "encrypted_password": "secret",
            },
        )

        assert response.status_code == 401

    async def test_returns_403_when_user_is_inactive(
        self,
        client: AsyncClient,
        builder: Builder,
        password_service: MockPasswordService,
    ) -> None:
        raw_password = "secret123"
        hashed = password_service.hash(raw_password)
        await builder.build_user(
            external_system_id="api_login_inactive",
            hashed_password=hashed,
            is_active=False,
        )

        response = await client.post(
            "/api/v1/auth/login",
            json={
                "external_system_id": "api_login_inactive",
                "encrypted_password": raw_password,
            },
        )

        assert response.status_code == 403
        body = response.json()["detail"]
        assert body["code"] == "ACCOUNT_INACTIVE"
