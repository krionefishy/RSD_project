from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPatchBlockUser:
    async def test_returns_200_when_super_admin_blocks_user(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.build_user(
            external_system_id="super_admin_block",
            role=UserRole.SUPER_ADMIN,
        )
        target = await builder.build_user(external_system_id="block_target")

        response = await client.patch(
            f"/api/v1/admin/software/users/{target.id}/block",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["is_active"] is False

    async def test_returns_403_when_seller_blocks_user(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="block_target_forbidden")

        response = await client.patch(
            f"/api/v1/admin/software/users/{target.id}/block",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
