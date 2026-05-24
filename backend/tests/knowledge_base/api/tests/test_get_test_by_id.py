from __future__ import annotations

from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetTestById:
    async def test_returns_200_when_seller_is_enrolled_and_test_in_course(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_get_test_seller",
            role=UserRole.SELLER,
        )
        course = await builder.build_course(name="API Test Course")
        test = await builder.build_test(name="API Course Test")
        await builder.build_course_test(course=course, test=test)
        await builder.build_course_user(user=seller, course=course)

        response = await client.get(
            f"/api/v1/kb/tests/{test.id}",
            headers=bearer_headers(seller),
            params={"course_id": course.id},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == test.id

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        course = await builder.build_course(name="API Test No Auth Course")
        test = await builder.build_test(name="API No Auth Test")
        await builder.build_course_test(course=course, test=test)

        response = await client.get(
            f"/api/v1/kb/tests/{test.id}",
            params={"course_id": course.id},
        )

        assert response.status_code == 401
