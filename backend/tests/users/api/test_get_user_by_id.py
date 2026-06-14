from httpx import AsyncClient

from tests.builder import Builder


class TestGetUserById:
    async def test_returns_200_when_user_exists(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(
            f"/api/v1/users/{seller.id}",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == str(seller.id)

    async def test_returns_404_when_user_not_found(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(
            "00000000-0000-0000-0000-000000000099",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 404

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(f"/api/v1/users/{seller.id}")

        assert response.status_code == 401
