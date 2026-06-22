from decimal import Decimal

from httpx import AsyncClient

from tests.builder import Builder


class TestGetEmployeeCompensation:
    async def test_returns_200_when_admin_staff_requests_employee_compensation(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.default_seller
        await builder.build_employee_compensation(
            user=seller,
            hourly_rate=Decimal("600.00"),
        )

        response = await client.get(
            f"/api/v1/personnel/users/{seller.id}/compensation",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["hourly_rate"] == "600.00"

    async def test_returns_200_when_admin_education_requests_employee_compensation(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin_edu = await builder.default_admin_education
        seller = await builder.default_seller
        await builder.build_employee_compensation(
            user=seller,
            hourly_rate=Decimal("500.00"),
        )

        response = await client.get(
            f"/api/v1/personnel/users/{seller.id}/compensation",
            headers=bearer_headers(admin_edu),
        )

        assert response.status_code == 200

    async def test_returns_403_when_seller_requests_another_employee_compensation(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        other = await builder.build_user(external_system_id="other_seller_comp")

        response = await client.get(
            f"/api/v1/personnel/users/{other.id}/compensation",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(f"/api/v1/personnel/users/{seller.id}/compensation")

        assert response.status_code == 401
