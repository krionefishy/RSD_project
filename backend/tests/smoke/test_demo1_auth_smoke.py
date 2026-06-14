import pytest
from httpx import AsyncClient

from tests.builder import Builder
from tests.mocks import MockPasswordService


@pytest.mark.smoke
class TestDemo1AuthSmoke:
    async def test_blocked_user_cannot_login_refresh_or_access_protected_route(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        password_service: MockPasswordService,
    ) -> None:
        admin = await builder.default_admin_staff
        raw_password = "secret123"
        seller = await builder.build_user(
            external_system_id="smoke_blocked_seller",
            hashed_password=password_service.hash(raw_password),
        )

        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "external_system_id": seller.external_system_id,
                "encrypted_password": raw_password,
            },
        )
        assert login_response.status_code == 200
        access_token = login_response.json()["access_token"]
        refresh_token = login_response.json()["refresh_token"]

        block_response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/block-profile",
            headers=bearer_headers(admin),
        )
        assert block_response.status_code == 200

        relogin_response = await client.post(
            "/api/v1/auth/login",
            json={
                "external_system_id": seller.external_system_id,
                "encrypted_password": raw_password,
            },
        )
        assert relogin_response.status_code == 403
        assert relogin_response.json()["detail"]["code"] == "ACCOUNT_INACTIVE"

        refresh_response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert refresh_response.status_code == 401
        assert refresh_response.json()["detail"]["code"] == "REFRESH_INVALID"

        me_response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert me_response.status_code == 403
        assert me_response.json()["detail"]["code"] == "ACCOUNT_INACTIVE"
