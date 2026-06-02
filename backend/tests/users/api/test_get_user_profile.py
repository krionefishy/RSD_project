from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestGetUserProfile:
    async def test_returns_200_when_seller_requests_own_profile_by_id(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(
            f"/api/v1/users/{seller.id}/profile",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == str(seller.id)

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(f"/api/v1/users/{seller.id}/profile")

        assert response.status_code == 401
