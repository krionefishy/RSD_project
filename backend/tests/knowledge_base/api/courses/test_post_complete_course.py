from __future__ import annotations

from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPostCompleteCourse:
    async def test_returns_200_when_seller_completes_course_with_met_requirements(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_complete_course_seller",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(
            course_kwargs={"mrp": 10},
            material_count=1,
        )
        test = await builder.build_test(name="API Complete Test")
        await builder.build_course_test(course=course, test=test)
        await builder.build_course_user(
            user=seller,
            course=course,
            user_points_by_course=10,
        )
        await builder.build_user_course_material(
            user=seller,
            course=course,
            material=materials[0],
            is_completed=True,
        )
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            is_passed=True,
            score=100,
        )

        response = await client.post(
            "/api/v1/kb/courses/complete",
            headers=bearer_headers(seller),
            json={"course_id": course.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["completed"] is True

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        course = await builder.build_course(name="API Complete No Auth")

        response = await client.post(
            "/api/v1/kb/courses/complete",
            json={"course_id": course.id},
        )

        assert response.status_code == 401
