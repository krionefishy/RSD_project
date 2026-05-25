from __future__ import annotations

from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPostCreateCourse:
    async def test_returns_200_when_education_admin_creates_course(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        response = await client.post(
            "/api/v1/admin/education/courses",
            headers=bearer_headers(education_admin),
            json={
                "name": "Новый курс API",
                "description": "Описание",
                "rating_points": 50,
                "mrp": 40,
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Новый курс API"
        assert body["materials_count"] == 0

    async def test_returns_403_when_seller_creates_course(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.post(
            "/api/v1/admin/education/courses",
            headers=bearer_headers(seller),
            json={"name": "Запрещённый курс"},
        )

        assert response.status_code == 403

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.post(
            "/api/v1/admin/education/courses",
            json={"name": "No Auth Course"},
        )

        assert response.status_code == 401
