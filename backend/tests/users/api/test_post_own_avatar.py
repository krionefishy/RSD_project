from httpx import AsyncClient

from app.personnel.domain import MAX_AVATAR_BYTES
from tests.builder import Builder


class TestPostOwnAvatar:
    async def test_returns_200_when_authenticated_seller_uploads_avatar(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        files = {"file": ("avatar.png", b"fake-image-bytes", "image/png")}

        response = await client.post(
            "/api/v1/users/me/avatar",
            headers=bearer_headers(seller),
            files=files,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["avatar_url"]

    async def test_returns_422_when_content_type_is_not_an_image(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        files = {"file": ("document.pdf", b"%PDF-1.4", "application/pdf")}

        response = await client.post(
            "/api/v1/users/me/avatar",
            headers=bearer_headers(seller),
            files=files,
        )

        assert response.status_code == 422
        assert response.json()["detail"] == "Unsupported image type"

    async def test_returns_422_when_content_type_is_gif(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        files = {"file": ("avatar.gif", b"GIF89a", "image/gif")}

        response = await client.post(
            "/api/v1/users/me/avatar",
            headers=bearer_headers(seller),
            files=files,
        )

        assert response.status_code == 422
        assert response.json()["detail"] == "Unsupported image type"

    async def test_returns_422_when_file_is_empty(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        files = {"file": ("avatar.png", b"", "image/png")}

        response = await client.post(
            "/api/v1/users/me/avatar",
            headers=bearer_headers(seller),
            files=files,
        )

        assert response.status_code == 422
        assert response.json()["detail"] == "Empty file"

    async def test_returns_422_when_file_exceeds_size_limit(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        files = {
            "file": ("avatar.jpg", b"x" * (MAX_AVATAR_BYTES + 1), "image/jpeg"),
        }

        response = await client.post(
            "/api/v1/users/me/avatar",
            headers=bearer_headers(seller),
            files=files,
        )

        assert response.status_code == 422
        assert response.json()["detail"] == "File is too large"

    async def test_returns_401_when_authorization_header_missing(
        self,
        client: AsyncClient,
    ) -> None:
        files = {"file": ("avatar.png", b"fake-image-bytes", "image/png")}
        response = await client.post("/api/v1/users/me/avatar", files=files)

        assert response.status_code == 401
