from datetime import date
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


@pytest.mark.smoke
class TestDemo1ScopeSmoke:
    async def test_roles_see_only_allowed_timesheet_scope(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        manager, manager_block, _ = await builder.build_manager_with_block(
            user_kwargs={"external_system_id": "smoke_manager"},
            block_kwargs={"name": "Smoke manager block"},
        )
        location = await builder.build_location(code="SMK001", name="Smoke Location", address="Smoke Address")
        await builder.build_block_location(block=manager_block, location=location)

        seller_in_scope = await builder.build_user(
            external_system_id="smoke_seller_in_scope",
            role=UserRole.SELLER,
        )
        await builder.build_block_member(user=seller_in_scope, block=manager_block)
        await builder.build_user_location(user=seller_in_scope, location=location)
        await builder.build_time_entry(
            user=seller_in_scope,
            work_date=date(2024, 10, 5),
            hours=Decimal("8.00"),
        )

        seller_out_scope = await builder.build_user(
            external_system_id="smoke_seller_out_scope",
            role=UserRole.SELLER,
        )
        await builder.build_time_entry(
            user=seller_out_scope,
            work_date=date(2024, 10, 6),
            hours=Decimal("6.00"),
        )

        seller_self_response = await client.get(
            "/api/v1/users/me/timesheet",
            headers=bearer_headers(seller_in_scope),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )
        assert seller_self_response.status_code == 200

        seller_forbidden_response = await client.get(
            f"/api/v1/personnel/users/{seller_out_scope.id}/timesheet",
            headers=bearer_headers(seller_in_scope),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )
        assert seller_forbidden_response.status_code == 403

        manager_allowed_response = await client.get(
            f"/api/v1/personnel/users/{seller_in_scope.id}/timesheet",
            headers=bearer_headers(manager),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )
        assert manager_allowed_response.status_code == 200

        manager_forbidden_response = await client.get(
            f"/api/v1/personnel/users/{seller_out_scope.id}/timesheet",
            headers=bearer_headers(manager),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )
        assert manager_forbidden_response.status_code == 403

        admin_allowed_response = await client.get(
            f"/api/v1/personnel/users/{seller_out_scope.id}/timesheet",
            headers=bearer_headers(admin),
            params={"period_from": "2024-10-01", "period_to": "2024-10-31"},
        )
        assert admin_allowed_response.status_code == 200
