from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestPatchUpdateEmployeeProfile:
    async def test_returns_200_when_admin_staff_updates_profile(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(
            external_system_id="api_update_profile_target",
            first_name="Old",
        )

        response = await client.patch(
            f"/api/v1/admin/staff/users/{seller.id}/employee-profile",
            headers=bearer_headers(admin),
            json={"first_name": "New"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["first_name"] == "New"

    async def test_returns_403_when_seller_updates_profile(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_update_profile_forbidden")

        response = await client.patch(
            f"/api/v1/admin/staff/users/{target.id}/employee-profile",
            headers=bearer_headers(seller),
            json={"first_name": "Hacked"},
        )

        assert response.status_code == 403
