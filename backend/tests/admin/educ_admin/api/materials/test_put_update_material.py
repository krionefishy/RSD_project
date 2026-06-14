from httpx import AsyncClient

from tests.builder import Builder


class TestPutUpdateMaterial:
    async def test_returns_200_when_education_admin_updates_material(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        material = await builder.build_material(name="API Old Material")

        response = await client.put(
            f"/api/v1/admin/education/materials/{material.id}",
            headers=bearer_headers(education_admin),
            json={"name": "API Updated Material"},
        )

        assert response.status_code == 200
        assert response.json()["name"] == "API Updated Material"

    async def test_returns_404_when_material_not_found(
        self,
        client: AsyncClient,
        bearer_headers,
        education_admin,
    ) -> None:
        response = await client.put(
            "/api/v1/admin/education/materials/999999",
            headers=bearer_headers(education_admin),
            json={"name": "Missing"},
        )

        assert response.status_code == 404
