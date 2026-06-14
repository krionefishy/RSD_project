from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetListCourses:
    async def test_returns_200_when_seller_has_assigned_courses(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_list_courses_seller",
            role=UserRole.SELLER,
        )
        course = await builder.build_course(name="API List Course")
        await builder.build_course_user(user=seller, course=course)

        response = await client.get(
            "/api/v1/kb/courses/",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 200
        body = response.json()
        assert len(body["items"]) >= 1

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.get("/api/v1/kb/courses/")

        assert response.status_code == 401
