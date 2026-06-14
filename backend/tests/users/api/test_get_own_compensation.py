from decimal import Decimal

from httpx import AsyncClient

from tests.builder import Builder


class TestGetOwnCompensation:
    async def test_returns_200_when_seller_has_compensation(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        await builder.build_employee_compensation(
            user=seller,
            hourly_rate=Decimal("500.00"),
        )

        response = await client.get(
            "/api/v1/users/me/compensation",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 200
        body = response.json()
        assert body is not None
        assert body["hourly_rate"] == "500.00"

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.get("/api/v1/users/me/compensation")

        assert response.status_code == 401
