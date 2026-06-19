from httpx import AsyncClient

from tests.builder import Builder


class TestPostResolveMaterialAttachments:
    async def test_returns_presigned_links_for_education_admin(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
        education_admin,
    ) -> None:
        material = await builder.build_material(text="")
        attachment = await builder.build_material_attachment(material=material, name="guide", format="pdf")

        response = await client.post(
            f"/api/v1/admin/education/materials/{material.id}/attachments/resolve",
            headers=bearer_headers(education_admin),
            json=[attachment.id],
        )

        assert response.status_code == 200
        body = response.json()
        assert len(body["items"]) == 1
        assert body["items"][0]["attachment_id"] == attachment.id
        assert "materials/" in body["items"][0]["url"]
