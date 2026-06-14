from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPostAssignUserBlock:
    async def test_returns_200_when_super_admin_assigns_seller_to_block(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.build_user(
            external_system_id="super_admin_user_block",
            role=UserRole.SUPER_ADMIN,
        )
        seller = await builder.build_user(external_system_id="api_seller_block_assign")
        block = await builder.build_block(name="API Seller Block")

        response = await client.post(
            f"/api/v1/admin/software/users/{seller.id}/block",
            headers=bearer_headers(admin),
            json={"block_id": block.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["block_id"] == block.id

    async def test_returns_403_when_seller_assigns_user_block(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        other = await builder.build_user(external_system_id="other_block_assign")
        block = await builder.default_block

        response = await client.post(
            f"/api/v1/admin/software/users/{other.id}/block",
            headers=bearer_headers(seller),
            json={"block_id": block.id},
        )

        assert response.status_code == 403
