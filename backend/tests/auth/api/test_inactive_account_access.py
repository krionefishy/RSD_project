from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestInactiveAccountAccess:
    async def test_returns_403_for_protected_route_when_account_inactive(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        inactive_user = await builder.build_user(
            external_system_id="inactive_access_user",
            is_active=False,
        )

        response = await client.get(
            "/api/v1/users/me",
            headers=bearer_headers(inactive_user),
        )

        assert response.status_code == 403
        body = response.json()["detail"]
        assert body["code"] == "ACCOUNT_INACTIVE"

    async def test_allows_protected_route_when_account_active(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        active_user = await builder.build_user(
            external_system_id="active_access_user",
            is_active=True,
        )

        response = await client.get(
            "/api/v1/users/me",
            headers=bearer_headers(active_user),
        )

        assert response.status_code == 200
