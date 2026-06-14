from httpx import AsyncClient

from tests.builder import Builder


class TestPostCreateEmployee:
    async def test_returns_200_when_admin_staff_creates_employee(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        block = await builder.build_block(name="API Staff Block")
        location = await builder.build_location(code="API_STAFF_LOC", name="Staff Office")
        await builder.build_block_location(block=block, location=location)

        response = await client.post(
            "/api/v1/admin/staff/employees",
            headers=bearer_headers(admin),
            json={
                "external_system_id": "api_new_employee_001",
                "first_name": "Anna",
                "last_name": "Seller",
                "location_id": location.id,
                "block_id": block.id,
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["user"]["external_system_id"] == "api_new_employee_001"

    async def test_returns_403_when_seller_creates_employee(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        block = await builder.default_block
        location = await builder.default_location

        response = await client.post(
            "/api/v1/admin/staff/employees",
            headers=bearer_headers(seller),
            json={
                "external_system_id": "api_forbidden_employee",
                "first_name": "X",
                "last_name": "Y",
                "location_id": location.id,
                "block_id": block.id,
            },
        )

        assert response.status_code == 403
