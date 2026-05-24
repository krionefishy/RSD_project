from __future__ import annotations

from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestPostCreateUser:
    async def test_returns_200_when_super_admin_creates_user(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.build_user(
            external_system_id="super_admin_sw",
            role=UserRole.SUPER_ADMIN,
        )

        response = await client.post(
            "/api/v1/admin/software/users",
            headers=bearer_headers(admin),
            json={
                "external_system_id": "api_sw_new_user",
                "password": "secure_password_123",
                "role": "seller",
                "first_name": "New",
                "last_name": "User",
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["user"]["external_system_id"] == "api_sw_new_user"

    async def test_returns_403_when_seller_creates_user(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller

        response = await client.post(
            "/api/v1/admin/software/users",
            headers=bearer_headers(seller),
            json={
                "external_system_id": "api_sw_forbidden",
                "password": "secure_password_123",
                "role": "seller",
            },
        )

        assert response.status_code == 403

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        response = await client.post(
            "/api/v1/admin/software/users",
            json={
                "external_system_id": "api_sw_no_auth",
                "password": "secure_password_123",
                "role": "seller",
            },
        )

        assert response.status_code == 401
