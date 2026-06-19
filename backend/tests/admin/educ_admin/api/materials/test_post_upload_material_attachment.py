from httpx import AsyncClient

from tests.builder import Builder


class TestPostUploadMaterialAttachment:
    async def test_returns_200_when_education_admin_uploads_attachment(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        material = await builder.build_material()
        files = {"file": ("guide.pdf", b"pdf-bytes", "application/pdf")}

        response = await client.post(
            f"/api/v1/admin/education/materials/{material.id}/attachments",
            headers=bearer_headers(education_admin),
            files=files,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["format"] == "pdf"

    async def test_returns_422_when_file_type_invalid(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        material = await builder.build_material()
        files = {"file": ("script.exe", b"bytes", "application/octet-stream")}

        response = await client.post(
            f"/api/v1/admin/education/materials/{material.id}/attachments",
            headers=bearer_headers(education_admin),
            files=files,
        )

        assert response.status_code == 422

    async def test_returns_409_when_second_pdf_uploaded_for_pdf_material(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        material = await builder.build_material(text="")
        await builder.build_material_attachment(material=material, name="guide", format="pdf")
        files = {"file": ("guide2.pdf", b"pdf-bytes", "application/pdf")}

        response = await client.post(
            f"/api/v1/admin/education/materials/{material.id}/attachments",
            headers=bearer_headers(education_admin),
            files=files,
        )

        assert response.status_code == 409
