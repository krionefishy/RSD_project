from __future__ import annotations

from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPatchChangeSellerRole:
    async def test_returns_200_when_admin_staff_changes_seller_role(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(
            external_system_id="api_seller_role_target",
            role=UserRole.SELLER,
        )

        response = await client.patch(
            f"/api/v1/admin/staff/users/{seller.id}/seller-role",
            headers=bearer_headers(admin),
            json={"seller_role": "senior_seller"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["seller_role"] == "senior_seller"

    async def test_returns_403_when_seller_changes_role(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_seller_role_forbidden")

        response = await client.patch(
            f"/api/v1/admin/staff/users/{target.id}/seller-role",
            headers=bearer_headers(seller),
            json={"seller_role": "senior_seller"},
        )

        assert response.status_code == 403
