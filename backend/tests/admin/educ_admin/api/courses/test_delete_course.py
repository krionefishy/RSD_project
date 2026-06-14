from httpx import AsyncClient

from tests.builder import Builder


class TestDeleteCourse:
    async def test_returns_204_when_education_admin_deletes_course(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        course = await builder.build_course(name="API Delete Course")

        response = await client.delete(
            f"/api/v1/admin/education/courses/{course.id}",
            headers=bearer_headers(education_admin),
        )

        assert response.status_code == 204

    async def test_returns_404_when_course_not_found(
        self,
        client: AsyncClient,
        bearer_headers,
        education_admin,
    ) -> None:
        response = await client.delete(
            "/api/v1/admin/education/courses/999999",
            headers=bearer_headers(education_admin),
        )

        assert response.status_code == 404
