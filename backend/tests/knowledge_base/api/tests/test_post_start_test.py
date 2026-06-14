from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPostStartTest:
    async def test_returns_200_when_seller_starts_enrolled_test(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_start_test_seller",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(task_count=1)
        await builder.build_course_user(user=seller, course=course)

        response = await client.post(
            "/api/v1/kb/tests/start",
            headers=bearer_headers(seller),
            json={"course_id": course.id, "test_id": test.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["test_id"] == test.id

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        course = await builder.build_course(name="API Start No Auth")
        test = await builder.build_test(name="API Start No Auth Test")
        await builder.build_course_test(course=course, test=test)

        response = await client.post(
            "/api/v1/kb/tests/start",
            json={"course_id": course.id, "test_id": test.id},
        )

        assert response.status_code == 401
