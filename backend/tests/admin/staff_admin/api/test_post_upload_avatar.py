from httpx import AsyncClient

from app.personnel.domain import MAX_AVATAR_BYTES
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

    async def test_returns_200_when_admin_staff_uploads_webp_avatar(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_staff_avatar_webp")
        files = {"file": ("avatar.webp", b"fake-webp-bytes", "image/webp")}

        response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/avatar",
            headers=bearer_headers(admin),
            files=files,
        )

        assert response.status_code == 200
        assert response.json()["avatar_url"]

    async def test_returns_422_when_file_exceeds_size_limit(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_staff_avatar_big")
        files = {
            "file": ("avatar.jpg", b"x" * (MAX_AVATAR_BYTES + 1), "image/jpeg"),
        }

        response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/avatar",
            headers=bearer_headers(admin),
            files=files,
        )

        assert response.status_code == 422
        assert response.json()["detail"] == "File is too large"

    async def test_returns_422_for_invalid_content_type(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_staff_avatar_invalid")
        files = {"file": ("avatar.gif", b"GIF89a", "image/gif")}

        response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/avatar",
            headers=bearer_headers(admin),
            files=files,
        )

        assert response.status_code == 422
        assert response.json()["detail"] == "Unsupported image type"

    async def test_returns_422_for_empty_file(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="api_staff_avatar_empty")
        files = {"file": ("avatar.png", b"", "image/png")}

        response = await client.post(
            f"/api/v1/admin/staff/users/{seller.id}/avatar",
            headers=bearer_headers(admin),
            files=files,
        )

        assert response.status_code == 422
        assert response.json()["detail"] == "Empty file"
