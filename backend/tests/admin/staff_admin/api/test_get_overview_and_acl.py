from httpx import AsyncClient

from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetPersonnelOverview:
    async def test_returns_counts_for_admin_staff(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        await builder.build_user(external_system_id="overview_seller", role=UserRole.SELLER)
        await builder.build_user(external_system_id="overview_manager", role=UserRole.MANAGER)
        await builder.build_user(external_system_id="overview_admin_edu", role=UserRole.ADMIN_EDUCATION)
        await builder.build_location(code="OV-LOC", name="Overview Location", address="Addr")

        response = await client.get(
            "/api/v1/admin/staff/overview",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        body = response.json()
        assert body["employees_count"] >= 2
        assert body["locations_count"] >= 1
        assert body["blocks_count"] >= 0


class TestListUsersAdminStaffAcl:
    async def test_admin_staff_does_not_see_other_admins(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        await builder.build_user(external_system_id="acl_seller", role=UserRole.SELLER)
        other_admin = await builder.build_user(
            external_system_id="acl_admin_edu",
            role=UserRole.ADMIN_EDUCATION,
        )

        response = await client.get(
            "/api/v1/admin/staff/users",
            headers=bearer_headers(admin),
        )

        assert response.status_code == 200
        roles = {item["role"] for item in response.json()["items"]}
        assert UserRole.ADMIN_EDUCATION.value not in roles
        assert UserRole.ADMIN_STAFF.value not in roles or str(admin.id) in {
            item["id"] for item in response.json()["items"] if item["role"] == UserRole.ADMIN_STAFF.value
        }
        user_ids = {item["id"] for item in response.json()["items"]}
        assert str(other_admin.id) not in user_ids

    async def test_admin_staff_cannot_patch_other_admin(
        self,
        client: AsyncClient,
        builder: Builder,
        bearer_headers,
    ) -> None:
        admin = await builder.default_admin_staff
        other_admin = await builder.build_user(
            external_system_id="acl_patch_target",
            role=UserRole.ADMIN_EDUCATION,
            first_name="Before",
        )

        response = await client.patch(
            f"/api/v1/admin/staff/users/{other_admin.id}",
            headers=bearer_headers(admin),
            json={"first_name": "After"},
        )

        assert response.status_code == 403
