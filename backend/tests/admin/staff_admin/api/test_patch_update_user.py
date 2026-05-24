from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestPatchUpdateUser:
    async def test_returns_200_when_admin_staff_updates_user(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(
            external_system_id="api_legacy_update_target",
            first_name="Before",
        )

        response = await client.patch(
            f"/api/v1/admin/staff/users/{seller.id}",
            headers=bearer_headers(admin),
            json={"first_name": "After"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["first_name"] == "After"

    async def test_returns_403_when_seller_updates_user(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_legacy_update_forbidden")

        response = await client.patch(
            f"/api/v1/admin/staff/users/{target.id}",
            headers=bearer_headers(seller),
            json={"first_name": "Hacked"},
        )

        assert response.status_code == 403
