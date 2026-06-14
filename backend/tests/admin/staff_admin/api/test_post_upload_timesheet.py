from httpx import AsyncClient

from tests.builder import Builder


class TestPostUploadTimesheet:
    async def test_returns_200_when_admin_staff_uploads_timesheet_file(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        location = await builder.default_location
        files = {"file": ("timesheet.xlsx", b"fake-xlsx-content", "application/vnd.ms-excel")}

        response = await client.post(
            "/api/v1/admin/staff/timesheets/upload",
            headers=bearer_headers(admin),
            params={
                "period_from": "2024-10-01",
                "period_to": "2024-10-31",
                "location_id": location.id,
            },
            files=files,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["entries_count"] == 0
        assert body["rows_count"] == 0

    async def test_returns_403_when_seller_uploads_timesheet(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        seller = await builder.default_seller
        files = {"file": ("timesheet.xlsx", b"fake-xlsx-content", "application/vnd.ms-excel")}

        response = await client.post(
            "/api/v1/admin/staff/timesheets/upload",
            headers=bearer_headers(seller),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
            files=files,
        )

        assert response.status_code == 403
