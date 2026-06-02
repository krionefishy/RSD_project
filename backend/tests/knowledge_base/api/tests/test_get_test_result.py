from __future__ import annotations

from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetTestResult:
    async def test_returns_200_when_seller_has_completed_test(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_test_result_seller",
            role=UserRole.SELLER,
        )
        course = await builder.build_course(name="API Result Course")
        test = await builder.build_test(name="API Result Test")
        await builder.build_course_test(course=course, test=test)
        await builder.build_course_user(user=seller, course=course)
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            is_passed=True,
            score=80,
        )

        response = await client.get(
            f"/api/v1/kb/tests/{test.id}/result",
            headers=bearer_headers(seller),
            params={"course_id": course.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["test_id"] == test.id

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        course = await builder.build_course(name="API Result No Auth")
        test = await builder.build_test(name="API Result No Auth Test")
        await builder.build_course_test(course=course, test=test)

        response = await client.get(
            f"/api/v1/kb/tests/{test.id}/result",
            params={"course_id": course.id},
        )

        assert response.status_code == 401
