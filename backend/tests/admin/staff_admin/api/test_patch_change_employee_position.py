from __future__ import annotations

from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPatchChangeEmployeePosition:
    async def test_returns_200_when_admin_staff_changes_position(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(
            external_system_id="api_position_target",
            role=UserRole.SELLER,
        )

        response = await client.patch(
            f"/api/v1/admin/staff/users/{seller.id}/position",
            headers=bearer_headers(admin),
            json={"position": "Старший продавец"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["position"] == "Старший продавец"

    async def test_returns_403_when_seller_changes_position(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_position_forbidden")

        response = await client.patch(
            f"/api/v1/admin/staff/users/{target.id}/position",
            headers=bearer_headers(seller),
            json={"position": "Старший продавец"},
        )

        assert response.status_code == 403
