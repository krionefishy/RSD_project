import pytest
from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


@pytest.mark.asyncio
class TestSuperAdminBlocksAPI:
    async def test_list_blocks_returns_seeded_block(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_admin_blocks",
            role=UserRole.SUPER_ADMIN,
        )
        block = await builder.build_block(name="North Block")
        location = await builder.build_location(code="N-001", name="Store A", address="Street 1")
        await builder.build_block_location(block=block, location=location)

        response = await client.get(
            "/api/v1/admin/super/blocks",
            headers=bearer_headers(super_admin),
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["total"] >= 1
        item = next(row for row in payload["items"] if row["id"] == block.id)
        assert item["name"] == "North Block"
        assert item["stores"] == 1

    async def test_assign_location_to_another_block_returns_409(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        super_admin = await builder.build_user(
            external_system_id="super_admin_assign",
            role=UserRole.SUPER_ADMIN,
        )
        block_a = await builder.build_block(name="Block A")
        block_b = await builder.build_block(name="Block B")
        location = await builder.build_location(code="L-409", name="Conflict Store", address="Street 2")
        await builder.build_block_location(block=block_a, location=location)

        response = await client.post(
            f"/api/v1/admin/super/blocks/{block_b.id}/locations/{location.id}",
            headers=bearer_headers(super_admin),
        )

        assert response.status_code == 409
