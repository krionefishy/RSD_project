from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetMaterialById:
    async def test_returns_200_when_seller_is_enrolled_and_material_in_course(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_get_material_seller",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        await builder.build_course_user(user=seller, course=course)
        material = materials[0]

        response = await client.get(
            f"/api/v1/kb/materials/{material.id}",
            headers=bearer_headers(seller),
            params={"course_id": course.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == material.id
        assert body["is_completed"] is False

    async def test_returns_material_as_completed_when_seller_already_finished_it(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_get_material_completed_seller",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        await builder.build_course_user(user=seller, course=course)
        await builder.build_user_course_material(
            user=seller,
            course=course,
            material=materials[0],
            is_completed=True,
        )

        response = await client.get(
            f"/api/v1/kb/materials/{materials[0].id}",
            headers=bearer_headers(seller),
            params={"course_id": course.id},
        )

        assert response.status_code == 200
        assert response.json()["is_completed"] is True

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        course, materials, _ = await builder.build_course_with_materials(material_count=1)

        response = await client.get(
            f"/api/v1/kb/materials/{materials[0].id}",
            params={"course_id": course.id},
        )

        assert response.status_code == 401
