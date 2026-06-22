from httpx import AsyncClient

from tests.builder import Builder


class TestGetUsers:
    async def test_returns_200_when_personnel_viewer_lists_users(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        manager = await builder.default_manager

        response = await client.get(
            "/api/v1/users/",
            headers=bearer_headers(manager),
        )

        assert response.status_code == 200
        body = response.json()
        assert "items" in body

    async def test_returns_200_when_admin_education_lists_users(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin_edu = await builder.default_admin_education

        response = await client.get(
            "/api/v1/users/",
            headers=bearer_headers(admin_edu),
        )

        assert response.status_code == 200
        body = response.json()
        assert "items" in body

    async def test_returns_403_when_seller_lists_users(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(
            "/api/v1/users/",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.get("/api/v1/users/")

        assert response.status_code == 401
