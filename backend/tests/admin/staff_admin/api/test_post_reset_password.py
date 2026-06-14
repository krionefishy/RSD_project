from httpx import AsyncClient

from tests.builder import Builder


class TestPostResetPassword:
    async def test_returns_200_when_admin_staff_resets_password(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_reset_pwd_target")

        response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/reset-password",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert len(body["temp_password"]) == 12

    async def test_returns_403_when_seller_resets_password(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_reset_pwd_forbidden")

        response = await client.post(
            f"/api/v1/admin/staff/users/{target.id}/reset-password",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
