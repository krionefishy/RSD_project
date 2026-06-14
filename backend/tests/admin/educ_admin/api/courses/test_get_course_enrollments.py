from httpx import AsyncClient

from tests.builder import Builder


class TestGetCourseEnrollments:
    async def test_returns_200_with_enrollments_when_education_admin(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        course = await builder.build_course()
        seller = await builder.default_seller
        await builder.build_course_user(user=seller, course=course, user_points_by_course=30)

        response = await client.get(
            f"/api/v1/admin/education/courses/{course.id}/enrollments",
            headers=bearer_headers(education_admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert len(body["items"]) == 1
        assert body["items"][0]["user_id"] == str(seller.id)
        assert body["items"][0]["progress"] == 30.0

    async def test_returns_404_when_course_not_found(
        self,
        client: AsyncClient,
        bearer_headers,
        education_admin,
    ) -> None:
        response = await client.get(
            "/api/v1/admin/education/courses/999999/enrollments",
            headers=bearer_headers(education_admin),
        )

        assert response.status_code == 404
