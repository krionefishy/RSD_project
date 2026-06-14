from httpx import AsyncClient

from tests.builder import Builder


class TestPostCreateMaterial:
    async def test_returns_200_when_education_admin_creates_material(
        self,
        client: AsyncClient,
        bearer_headers,
        education_admin,
    ) -> None:
        response = await client.post(
            "/api/v1/admin/education/materials",
            headers=bearer_headers(education_admin),
            json={
                "name": "API Material",
                "category": "sales",
                "description": "Desc",
                "text": "Body text",
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "API Material"
        assert body["category"] == "sales"

    async def test_returns_403_when_seller_creates_material(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.post(
            "/api/v1/admin/education/materials",
            headers=bearer_headers(seller),
            json={
                "name": "Blocked",
                "category": "sales",
                "text": "text",
            },
        )

        assert response.status_code == 403
