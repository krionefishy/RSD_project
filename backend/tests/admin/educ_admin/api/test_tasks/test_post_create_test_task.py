from httpx import AsyncClient


class TestPostCreateTestTask:
    async def test_returns_200_when_education_admin_creates_task(
        self,
        client: AsyncClient,
        bearer_headers,
        education_admin,
    ) -> None:
        response = await client.post(
            "/api/v1/admin/education/test-tasks",
            headers=bearer_headers(education_admin),
            json={
                "name": "API Question",
                "points": 10,
                "answer_variants": ["Yes", "No"],
                "correct_variant": 0,
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "API Question"
        assert body["points"] == 10

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.post(
            "/api/v1/admin/education/test-tasks",
            json={
                "name": "No Auth",
                "answer_variants": ["A", "B"],
                "correct_variant": 0,
            },
        )

        assert response.status_code == 401
