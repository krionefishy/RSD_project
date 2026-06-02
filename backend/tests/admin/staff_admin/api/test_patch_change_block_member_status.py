from __future__ import annotations

from httpx import AsyncClient

from app.locations.db_models import BlockMemberStatus
from tests.builder import Builder


class TestPatchChangeBlockMemberStatus:
    async def test_returns_200_when_admin_staff_changes_block_member_status(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        block = await builder.build_block(name="API Member Status Block")
        seller = await builder.build_user(external_system_id="api_member_status_target")
        await builder.build_block_member(user=seller, block=block)

        response = await client.patch(
            f"/api/v1/admin/staff/users/{seller.id}/block-member-status",
            headers=bearer_headers(admin),
            json={"block_id": block.id, "status": BlockMemberStatus.RESERVE.value},
        )

        assert response.status_code == 200

    async def test_returns_403_when_seller_changes_block_member_status(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        block = await builder.default_block
        target = await builder.build_user(external_system_id="api_member_status_forbidden")
        await builder.build_block_member(user=target, block=block)

        response = await client.patch(
            f"/api/v1/admin/staff/users/{target.id}/block-member-status",
            headers=bearer_headers(seller),
            json={"block_id": block.id, "status": BlockMemberStatus.RESERVE.value},
        )

        assert response.status_code == 403
