from __future__ import annotations

from httpx import AsyncClient

from tests.builder import Builder


class TestPostUploadAvatar:
    async def test_returns_200_when_admin_staff_uploads_avatar(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_staff_avatar_target")
        files = {"file": ("avatar.jpg", b"fake-jpeg-bytes", "image/jpeg")}

        response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/avatar",
            headers=bearer_headers(admin),
            files=files,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["avatar_url"]

    async def test_returns_403_when_seller_uploads_avatar_for_other(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        target = await builder.build_user(external_system_id="api_staff_avatar_forbidden")
        files = {"file": ("avatar.jpg", b"fake-jpeg-bytes", "image/jpeg")}

        response = await client.post(
            f"/api/v1/admin/staff/users/{target.id}/avatar",
            headers=bearer_headers(seller),
            files=files,
        )

        assert response.status_code == 403
