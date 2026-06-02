from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestDeleteEmployeeProfile:
    async def test_returns_200_when_admin_staff_deletes_profile(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_delete_profile_target")

        response = await client.delete(
            f"/api/v1/admin/staff/users/{seller.id}/employee-profile",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["deleted"] is True

    async def test_returns_403_when_seller_deletes_profile(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_delete_profile_forbidden")

        response = await client.delete(
            f"/api/v1/admin/staff/users/{target.id}/employee-profile",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
