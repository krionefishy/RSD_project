from __future__ import annotations

from decimal import Decimal

from httpx import AsyncClient

from tests.builder import Builder


class TestPatchUpdateTimeEntry:
    async def test_returns_200_when_admin_staff_updates_time_entry(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        entry = await builder.build_time_entry(hours=Decimal("6.00"))

        response = await client.patch(
            f"/api/v1/admin/staff/timesheets/entries/{entry.id}",
            headers=bearer_headers(admin),
            json={"hours": "7.50", "comment": "Corrected"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["hours"] == "7.50"

    async def test_returns_403_when_seller_updates_time_entry(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        entry = await builder.build_time_entry(hours=Decimal("6.00"))

        response = await client.patch(
            f"/api/v1/admin/staff/timesheets/entries/{entry.id}",
            headers=bearer_headers(seller),
            json={"hours": "7.50"},
        )

        assert response.status_code == 403
