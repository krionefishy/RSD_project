from httpx import AsyncClient

from tests.builder import Builder


class TestGetListMaterials:
    async def test_returns_200_when_education_admin_lists_materials(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        await builder.build_material(name="API Material 1")

        response = await client.get(
            "/api/v1/admin/education/materials",
            headers=bearer_headers(education_admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert any(item["name"] == "API Material 1" for item in body["items"])

    async def test_returns_403_when_seller_lists_materials(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.get(
            "/api/v1/admin/education/materials",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 403
