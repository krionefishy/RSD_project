from datetime import date, timedelta

import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.profiles.create_employee_profile_usecase import (
    CreateEmployeeProfileUseCase,
)
from app.personnel.domain import CreateEmployeeProfileRequest
from app.users.db_models import UserRole
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError
from tests.builder import Builder
from tests.mocks import MockPasswordService


class TestCreateEmployeeProfileUseCase:
    async def test_creates_seller_with_location_and_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        block = await builder.build_block(name="Staff Block")
        location = await builder.build_location(code="STAFF_LOC", name="Staff Office")
        await builder.build_block_location(block=block, location=location)
        ctx = builder.auth_context_for(admin)
        request = CreateEmployeeProfileRequest(
            external_system_id="new_employee_001",
            first_name="Anna",
            last_name="Seller",
            location_id=location.id,
            block_id=block.id,
        )

        result = await CreateEmployeeProfileUseCase(
            db_session,
            MockPasswordService(),
        ).execute(request, ctx)

        assert result.user.external_system_id == "new_employee_001"
        assert result.user.role == UserRole.SELLER.value
        assert result.user.location is not None
        assert result.user.block is not None
        assert len(result.temp_password) == 12

    async def test_raises_conflict_when_external_id_exists(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        await builder.build_user(external_system_id="duplicate_employee")
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileConflictError):
            await CreateEmployeeProfileUseCase(db_session, MockPasswordService()).execute(
                CreateEmployeeProfileRequest(external_system_id="duplicate_employee"),
                ctx,
            )

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await CreateEmployeeProfileUseCase(db_session, MockPasswordService()).execute(
                CreateEmployeeProfileRequest(external_system_id="seller_create_attempt"),
                ctx,
            )

    async def test_raises_when_location_not_in_block(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        block = await builder.build_block(name="Block A")
        location = await builder.build_location(code="LOC_ORPHAN", name="Orphan Office")
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileConflictError):
            await CreateEmployeeProfileUseCase(db_session, MockPasswordService()).execute(
                CreateEmployeeProfileRequest(
                    external_system_id="bad_location_employee",
                    block_id=block.id,
                    location_id=location.id,
                ),
                ctx,
            )

    async def test_raises_validation_for_future_birth_date(
        self,
        builder: Builder,
    ) -> None:
        with pytest.raises(ValidationError):
            CreateEmployeeProfileRequest(
                external_system_id="future_birth",
                birth_date=date.today() + timedelta(days=1),
            )
