from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestPostAssignUserLocation:
    async def test_returns_200_when_admin_staff_assigns_location(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_assign_loc_target")
        location = await builder.build_location(code="API_ASSIGN_LOC", name="Assign Office")

        response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/location",
            headers=bearer_headers(admin),
            json={"location_id": location.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["location_id"] == location.id

    async def test_returns_403_when_seller_assigns_location(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_assign_loc_forbidden")
        location = await builder.default_location

        response = await client.post(
            f"/api/v1/admin/staff/users/{target.id}/location",
            headers=bearer_headers(seller),
            json={"location_id": location.id},
        )

        assert response.status_code == 403
