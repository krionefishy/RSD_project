from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder
from tests.mocks import MockPasswordService


class TestPostAuthRefresh:
    async def test_returns_200_when_refresh_token_valid(
        self,
        client: AsyncClient,
        builder: Builder,
        password_service: MockPasswordService,
    ) -> None:
        raw_password = "secret123"
        hashed = password_service.hash(raw_password)
        await builder.build_user(
            external_system_id="api_refresh_001",
            hashed_password=hashed,
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "external_system_id": "api_refresh_001",
                "encrypted_password": raw_password,
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["access_token"]
        assert body["refresh_token"]

    async def test_returns_401_when_refresh_token_invalid(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token"},
        )

        assert response.status_code == 401
