from httpx import AsyncClient

from tests.builder import Builder


class TestPostBlockEmployeeProfile:
    async def test_returns_200_when_admin_staff_blocks_profile(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_block_profile_target")

        response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/block-profile",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["is_active"] is False

    async def test_returns_403_when_seller_blocks_profile(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_block_profile_forbidden")

        response = await client.post(
            f"/api/v1/admin/staff/users/{target.id}/block-profile",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
