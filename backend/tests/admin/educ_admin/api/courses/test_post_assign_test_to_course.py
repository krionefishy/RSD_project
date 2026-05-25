from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestPostAssignTestToCourse:
    async def test_returns_200_when_education_admin_assigns_test(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        course = await builder.build_course()
        test = await builder.build_test(name="API Final Test", is_final=True)

        response = await client.post(
            f"/api/v1/admin/education/courses/{course.id}/tests",
            headers=bearer_headers(education_admin),
            json={"test_id": test.id, "is_final": True},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["test_id"] == test.id
        assert body["is_final"] is True
