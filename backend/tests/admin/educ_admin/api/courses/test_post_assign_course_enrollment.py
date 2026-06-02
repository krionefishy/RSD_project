from __future__ import annotations

from uuid import uuid4

from httpx import AsyncClient

from tests.builder import Builder


class TestPostAssignCourseEnrollment:
    async def test_returns_200_when_education_admin_assigns_course(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        course = await builder.build_course()
        seller = await builder.default_seller

        response = await client.post(
            f"/api/v1/admin/education/courses/{course.id}/enrollments",
            headers=bearer_headers(education_admin),
            json={"user_id": str(seller.id)},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["user_id"] == str(seller.id)
        assert body["progress"] == 0.0

    async def test_returns_404_when_user_not_found(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        course = await builder.build_course()

        response = await client.post(
            f"/api/v1/admin/education/courses/{course.id}/enrollments",
            headers=bearer_headers(education_admin),
            json={"user_id": str(uuid4())},
        )

        assert response.status_code == 404
