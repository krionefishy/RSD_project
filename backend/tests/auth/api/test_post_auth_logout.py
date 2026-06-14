from httpx import AsyncClient

from tests.builder import Builder
from tests.mocks import MockPasswordService


class TestPostAuthLogout:
    async def test_returns_204_when_refresh_token_valid(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        password_service: MockPasswordService,
    ) -> None:
        raw_password = "secret123"
        hashed = password_service.hash(raw_password)
        user = await builder.build_user(
            external_system_id="api_logout_001",
            hashed_password=hashed,
        )
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "external_system_id": "api_logout_001",
                "encrypted_password": raw_password,
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        response = await client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
            headers=bearer_headers(user),
        )

        assert response.status_code == 204

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": "some-token"},
        )

        assert response.status_code == 401
