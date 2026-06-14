from httpx import AsyncClient

from tests.builder import Builder


class TestPutUpdateCourse:
    async def test_returns_200_when_education_admin_updates_course(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        course = await builder.build_course(name="API Old Course")

        response = await client.put(
            f"/api/v1/admin/education/courses/{course.id}",
            headers=bearer_headers(education_admin),
            json={"name": "API Updated Course", "rating_points": 77},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "API Updated Course"
        assert body["id"] == course.id

    async def test_returns_404_when_course_not_found(
        self,
        client: AsyncClient,
        bearer_headers,
        education_admin,
    ) -> None:
        response = await client.put(
            "/api/v1/admin/education/courses/999999",
            headers=bearer_headers(education_admin),
            json={"name": "Missing"},
        )

        assert response.status_code == 404
