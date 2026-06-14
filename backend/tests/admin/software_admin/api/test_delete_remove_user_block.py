from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestDeleteRemoveUserBlock:
    async def test_returns_204_when_super_admin_removes_seller_from_block(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.build_user(
            external_system_id="super_admin_rm_block",
            role=UserRole.SUPER_ADMIN,
        )
        block = await builder.build_block(name="API Remove Block")
        seller = await builder.build_user(external_system_id="api_seller_rm_block")
        await builder.build_block_member(user=seller, block=block)

        response = await client.delete(
            f"/api/v1/admin/software/users/{seller.id}/block",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 204

    async def test_returns_403_when_seller_removes_user_block(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        other = await builder.build_user(external_system_id="other_rm_block")

        response = await client.delete(
            f"/api/v1/admin/software/users/{other.id}/block",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
