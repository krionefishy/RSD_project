from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestDeleteRemoveUserLocation:
    async def test_returns_204_when_admin_staff_removes_location(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller, _, _ = await builder.build_user_with_location(
            user_kwargs={"external_system_id": "api_remove_loc_target"},
        )

        response = await client.delete(
            f"/api/v1/admin/staff/users/{seller.id}/location",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 204

    async def test_returns_403_when_seller_removes_location(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target, _, _ = await builder.build_user_with_location(
            user_kwargs={"external_system_id": "api_remove_loc_forbidden"},
        )

        response = await client.delete(
            f"/api/v1/admin/staff/users/{target.id}/location",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
