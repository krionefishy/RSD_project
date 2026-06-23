from httpx import AsyncClient

from tests.builder import Builder


class TestPostCreateTest:
    async def test_returns_200_when_education_admin_creates_test(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        course = await builder.build_course(name="Course A")
        response = await client.post(
            "/api/v1/admin/education/tests",
            headers=bearer_headers(education_admin),
            json={
                "name": "API Quiz",
                "category": "compliance",
                "is_final": True,
                "course_id": course.id,
                "pass_score_percent": 75,
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "API Quiz"
        assert body["is_final"] is True
        assert body["course_id"] == course.id

    async def test_returns_403_when_seller_creates_test(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.post(
            "/api/v1/admin/education/tests",
            headers=bearer_headers(seller),
            json={"name": "Blocked", "category": "x"},
        )

        assert response.status_code == 403
