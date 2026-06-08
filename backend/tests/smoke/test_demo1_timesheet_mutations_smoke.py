from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from httpx import AsyncClient

from tests.builder import Builder


@pytest.mark.smoke
class TestDemo1TimesheetMutationsSmoke:
    async def test_update_and_delete_timesheet_entry_are_reflected_in_timesheet_views(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.default_seller
        entry = await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 10, 10),
            hours=Decimal("6.00"),
            comment="Before update",
        )

        patch_response = await client.patch(
            f"/api/v1/admin/staff/timesheets/entries/{entry.id}",
            headers=bearer_headers(admin),
            json={"hours": "7.50", "comment": "After update"},
        )
        assert patch_response.status_code == 200

        employee_after_patch = await client.get(
            f"/api/v1/personnel/users/{seller.id}/timesheet",
            headers=bearer_headers(admin),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )
        assert employee_after_patch.status_code == 200
        items_after_patch = employee_after_patch.json()["items"]
        patched_item = next((item for item in items_after_patch if item["id"] == entry.id), None)
        assert patched_item is not None
        assert patched_item["hours"] == "7.50"
        assert patched_item["comment"] == "After update"

        delete_response = await client.delete(
            f"/api/v1/admin/staff/timesheets/entries/{entry.id}",
            headers=bearer_headers(admin),
        )
        assert delete_response.status_code == 200
        assert delete_response.json()["deleted"] is True

        employee_after_delete = await client.get(
            f"/api/v1/personnel/users/{seller.id}/timesheet",
            headers=bearer_headers(admin),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )
        assert employee_after_delete.status_code == 200
        items_after_delete = employee_after_delete.json()["items"]
        assert all(item["id"] != entry.id for item in items_after_delete)
