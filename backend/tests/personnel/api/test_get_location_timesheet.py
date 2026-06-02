from __future__ import annotations

from datetime import date

from httpx import AsyncClient

from tests.builder import Builder


class TestGetLocationTimesheet:
    async def test_returns_200_when_admin_staff_requests_location_timesheet(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        block = await builder.default_block
        seller, location, _ = await builder.build_user_with_location()
        await builder.build_block_location(block=block, location=location)
        await builder.build_time_entry(user=seller, work_date=date(2024, 10, 3))

        response = await client.get(
            f"/api/v1/personnel/locations/{location.id}/timesheet",
            headers=bearer_headers(admin),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["location"]["id"] == location.id

    async def test_returns_403_when_seller_requests_location_timesheet(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        location = await builder.default_location

        response = await client.get(
            f"/api/v1/personnel/locations/{location.id}/timesheet",
            headers=bearer_headers(seller),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )

        assert response.status_code == 403

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        location = await builder.default_location

        response = await client.get(
            f"/api/v1/personnel/locations/{location.id}/timesheet",
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )

        assert response.status_code == 401
