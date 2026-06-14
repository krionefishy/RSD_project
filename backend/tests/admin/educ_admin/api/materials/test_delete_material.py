from httpx import AsyncClient

from tests.builder import Builder


class TestDeleteMaterial:
    async def test_returns_204_when_education_admin_deletes_material(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        material = await builder.build_material()

        response = await client.delete(
            f"/api/v1/admin/education/materials/{material.id}",
            headers=bearer_headers(education_admin),
        )

        assert response.status_code == 204

    async def test_returns_404_when_material_not_found(
        self,
        client: AsyncClient,
        bearer_headers,
        education_admin,
    ) -> None:
        response = await client.delete(
            "/api/v1/admin/education/materials/999999",
            headers=bearer_headers(education_admin),
        )

        assert response.status_code == 404
