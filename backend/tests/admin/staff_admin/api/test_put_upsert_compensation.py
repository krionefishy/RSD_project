from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestPutUpsertCompensation:
    async def test_returns_200_when_admin_staff_upserts_compensation(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_comp_target")

        response = await client.put(
            f"/api/v1/admin/staff/users/{seller.id}/compensation",
            headers=bearer_headers(admin),
            json={
                "base_salary": "50000.00",
                "hourly_rate": "500.00",
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["hourly_rate"] == "500.00"

    async def test_returns_403_when_seller_upserts_compensation(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_comp_forbidden")

        response = await client.put(
            f"/api/v1/admin/staff/users/{target.id}/compensation",
            headers=bearer_headers(seller),
            json={
                "base_salary": "50000.00",
                "hourly_rate": "500.00",
            },
        )

        assert response.status_code == 403
