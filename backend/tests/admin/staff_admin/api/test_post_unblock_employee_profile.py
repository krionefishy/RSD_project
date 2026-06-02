from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestPostUnblockEmployeeProfile:
    async def test_returns_200_when_admin_staff_unblocks_profile(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(
            external_system_id="api_unblock_profile_target",
            is_active=False,
        )

        response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/unblock-profile",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["is_active"] is True

    async def test_returns_403_when_seller_unblocks_profile(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(
            external_system_id="api_unblock_profile_forbidden",
            is_active=False,
        )

        response = await client.post(
            f"/api/v1/admin/staff/users/{target.id}/unblock-profile",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
