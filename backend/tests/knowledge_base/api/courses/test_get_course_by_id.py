from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetCourseById:
    async def test_returns_200_when_seller_is_enrolled_in_course(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="api_get_course_seller",
            role=UserRole.SELLER,
        )
        course = await builder.build_course(name="API Get Course")
        await builder.build_course_user(user=seller, course=course)

        response = await client.get(
            f"/api/v1/kb/courses/{course.id}",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == course.id

    async def test_returns_404_when_course_not_accessible(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        course = await builder.build_course(name="API Inaccessible Course")

        response = await client.get(
            f"/api/v1/kb/courses/{course.id}",
            headers=bearer_headers(seller),
        )

        assert response.status_code == 404

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
        builder: Builder,
    ) -> None:
        course = await builder.build_course(name="API No Auth Course")

        response = await client.get(f"/api/v1/kb/courses/{course.id}")

        assert response.status_code == 401
