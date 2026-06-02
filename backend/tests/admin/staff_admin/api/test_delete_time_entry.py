from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestDeleteTimeEntry:
    async def test_returns_200_when_admin_staff_deletes_time_entry(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        entry = await builder.build_time_entry()

        response = await client.delete(
            f"/api/v1/admin/staff/timesheets/entries/{entry.id}",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["deleted"] is True

    async def test_returns_403_when_seller_deletes_time_entry(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        entry = await builder.build_time_entry()

        response = await client.delete(
            f"/api/v1/admin/staff/timesheets/entries/{entry.id}",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
