from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPostAssignManagerBlock:
    async def test_returns_200_when_super_admin_assigns_manager_to_block(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.build_user(
            external_system_id="super_admin_mgr_block",
            role=UserRole.SUPER_ADMIN,
        )
        manager = await builder.build_user(
            external_system_id="api_manager_block",
            role=UserRole.MANAGER,
        )
        block = await builder.build_block(name="API Manager Block")

        response = await client.post(
            f"/api/v1/admin/software/users/{manager.id}/blocks",
            headers=bearer_headers(admin),
            json={"block_id": block.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["block_id"] == block.id

    async def test_returns_403_when_seller_assigns_manager_block(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        manager = await builder.default_manager
        block = await builder.default_block

        response = await client.post(
            f"/api/v1/admin/software/users/{manager.id}/blocks",
            headers=bearer_headers(seller),
            json={"block_id": block.id},
        )

        assert response.status_code == 403
