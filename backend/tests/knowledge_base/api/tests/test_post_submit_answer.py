from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPostSubmitAnswer:
    async def test_returns_200_when_seller_submits_correct_answer(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_submit_answer_seller",
            role=UserRole.SELLER,
        )
        course, test, tasks, _ = await builder.build_course_with_test(task_count=1)
        await builder.build_course_user(user=seller, course=course)
        await builder.build_user_course_test(user=seller, course=course, test=test)

        response = await client.post(
            "/api/v1/kb/tests/submit-answer",
            headers=bearer_headers(seller),
            json={
                "course_id": course.id,
                "test_id": test.id,
                "task_id": tasks[0].id,
                "selected_variant": 0,
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["is_correct"] is True

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        course, test, tasks, _ = await builder.build_course_with_test(task_count=1)

        response = await client.post(
            "/api/v1/kb/tests/submit-answer",
            json={
                "course_id": course.id,
                "test_id": test.id,
                "task_id": tasks[0].id,
                "selected_variant": 0,
            },
        )

        assert response.status_code == 401
