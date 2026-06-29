from httpx import AsyncClient

from tests.builder import Builder


class TestPatchOwnPhone:
    async def test_returns_200_when_phone_is_valid(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.patch(
            "/api/v1/users/me/phone",
            headers=bearer_headers(seller),
            json={"phone": "+7 999 123 45 67"},
        )

        assert response.status_code == 200
        assert response.json()["phone"] == "+7-999-123-45-67"

    async def test_returns_200_when_phone_is_cleared(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.patch(
            "/api/v1/users/me/phone",
            headers=bearer_headers(seller),
            json={"phone": ""},
        )

        assert response.status_code == 200
        assert response.json()["phone"] is None

    async def test_returns_422_when_phone_is_invalid(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.patch(
            "/api/v1/users/me/phone",
            headers=bearer_headers(seller),
            json={"phone": "not-a-phone"},
        )

        assert response.status_code == 422
