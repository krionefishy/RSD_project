from datetime import date
from decimal import Decimal

from httpx import AsyncClient

from tests.builder import Builder


class TestGetEmployeeTimesheet:
    async def test_returns_200_when_admin_staff_requests_employee_timesheet(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.default_seller
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 10, 5),
            hours=Decimal("8.00"),
        )

        response = await client.get(
            f"/api/v1/personnel/users/{seller.id}/timesheet",
            headers=bearer_headers(admin),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["user"]["id"] == str(seller.id)

    async def test_returns_200_when_admin_education_requests_employee_timesheet(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin_edu = await builder.default_admin_education
        seller = await builder.default_seller

        response = await client.get(
            f"/api/v1/personnel/users/{seller.id}/timesheet",
            headers=bearer_headers(admin_edu),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )

        assert response.status_code == 200

    async def test_returns_403_when_seller_requests_another_employee_timesheet(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        other = await builder.build_user(external_system_id="other_seller_timesheet")

        response = await client.get(
            f"/api/v1/personnel/users/{other.id}/timesheet",
            headers=bearer_headers(seller),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )

        assert response.status_code == 403

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(
            f"/api/v1/personnel/users/{seller.id}/timesheet",
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )

        assert response.status_code == 401
