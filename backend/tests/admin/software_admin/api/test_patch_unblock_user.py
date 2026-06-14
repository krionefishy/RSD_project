from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPatchUnblockUser:
    async def test_returns_200_when_super_admin_unblocks_user(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.build_user(
            external_system_id="super_admin_unblock",
            role=UserRole.SUPER_ADMIN,
        )
        target = await builder.build_user(
            external_system_id="unblock_target",
            is_active=False,
        )

        response = await client.patch(
            f"/api/v1/admin/software/users/{target.id}/unblock",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["is_active"] is True

    async def test_returns_403_when_seller_unblocks_user(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(
            external_system_id="unblock_target_forbidden",
            is_active=False,
        )

        response = await client.patch(
            f"/api/v1/admin/software/users/{target.id}/unblock",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
