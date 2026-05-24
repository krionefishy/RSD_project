from __future__ import annotations

from datetime import date
from decimal import Decimal

from httpx import AsyncClient

from tests.builder import Builder


class TestGetOwnTimesheet:
    async def test_returns_200_when_seller_has_entries_in_period(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 10, 1),
            hours=Decimal("8.00"),
        )

        response = await client.get(
            "/api/v1/users/me/timesheet",
            headers=bearer_headers(seller),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )

        assert response.status_code == 200
        body = response.json()
        assert len(body["items"]) == 1

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.get(
            "/api/v1/users/me/timesheet",
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )

        assert response.status_code == 401
