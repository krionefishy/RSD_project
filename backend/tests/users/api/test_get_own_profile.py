from httpx import AsyncClient

from tests.builder import Builder


class TestGetOwnProfile:
    async def test_returns_200_when_authenticated_seller_requests_own_profile(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(
            "/api/v1/users/me/profile",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == str(seller.id)

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.get("/api/v1/users/me/profile")

        assert response.status_code == 401
