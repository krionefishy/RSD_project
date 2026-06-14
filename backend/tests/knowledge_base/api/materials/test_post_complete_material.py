from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPostCompleteMaterial:
    async def test_returns_200_when_seller_completes_enrolled_material(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_complete_material_seller",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        await builder.build_course_user(user=seller, course=course)
        material = materials[0]

        response = await client.post(
            "/api/v1/kb/materials/complete",
            headers=bearer_headers(seller),
            json={"course_id": course.id, "material_id": material.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["material_id"] == material.id
        assert body["course_id"] == course.id

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        course, materials, _ = await builder.build_course_with_materials(material_count=1)

        response = await client.post(
            "/api/v1/kb/materials/complete",
            json={"course_id": course.id, "material_id": materials[0].id},
        )

        assert response.status_code == 401
