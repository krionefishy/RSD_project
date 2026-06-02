from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.profiles.update_employee_profile_usecase import (
    UpdateEmployeeProfileUseCase,
)
from app.personnel.domain import UpdateEmployeeProfileRequest
from tests.builder import Builder


class TestUpdateEmployeeProfileUseCase:
    async def test_updates_profile_fields(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(
            external_system_id="update_profile_user",
            first_name="Old",
        )
        ctx = builder.auth_context_for(admin)

        result = await UpdateEmployeeProfileUseCase(db_session).execute(
            seller.id,
            UpdateEmployeeProfileRequest(first_name="New", position="Barista"),
            ctx,
        )

        assert result.first_name == "New"
        assert result.position == "Barista"
