from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestPostAssignMaterialToCourse:
    async def test_returns_200_when_education_admin_assigns_material(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        course = await builder.build_course()
        material = await builder.build_material(name="API Material Link")

        response = await client.post(
            f"/api/v1/admin/education/courses/{course.id}/materials",
            headers=bearer_headers(education_admin),
            json={"material_id": material.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["material_id"] == material.id
        assert body["name"] == "API Material Link"
