from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.compensations.upsert_employee_compensation_usecase import (
    UpsertEmployeeCompensationUseCase,
)
from app.personnel.domain import UpsertEmployeeCompensationRequest
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder


class TestUpsertEmployeeCompensationUseCase:
    async def test_creates_compensation(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="upsert_comp_user")
        ctx = builder.auth_context_for(admin)
        request = UpsertEmployeeCompensationRequest(
            base_salary=Decimal("55000.00"),
            hourly_rate=Decimal("320.00"),
            night_hourly_rate=Decimal("380.00"),
        )

        result = await UpsertEmployeeCompensationUseCase(db_session).execute(
            seller.id,
            request,
            ctx,
        )

        assert result.user_id == seller.id
        assert result.effective_night_hourly_rate == Decimal("380.00")

    async def test_updates_existing_compensation(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.default_seller
        await builder.build_employee_compensation(user=seller, hourly_rate=Decimal("100.00"))
        ctx = builder.auth_context_for(admin)
        request = UpsertEmployeeCompensationRequest(
            base_salary=Decimal("50000.00"),
            hourly_rate=Decimal("200.00"),
        )

        result = await UpsertEmployeeCompensationUseCase(db_session).execute(
            seller.id,
            request,
            ctx,
        )

        assert result.hourly_rate == Decimal("200.00")

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        other = await builder.build_user(external_system_id="comp_forbidden_target")
        ctx = builder.auth_context_for(seller)
        request = UpsertEmployeeCompensationRequest(
            base_salary=Decimal("10000.00"),
            hourly_rate=Decimal("100.00"),
        )

        with pytest.raises(ProfileForbiddenError):
            await UpsertEmployeeCompensationUseCase(db_session).execute(other.id, request, ctx)

    async def test_raises_not_found_for_missing_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)
        request = UpsertEmployeeCompensationRequest(
            base_salary=Decimal("10000.00"),
            hourly_rate=Decimal("100.00"),
        )

        with pytest.raises(ProfileNotFoundError):
            await UpsertEmployeeCompensationUseCase(db_session).execute(uuid4(), request, ctx)

    async def test_raises_validation_for_negative_rate(
        self,
        builder: Builder,
    ) -> None:
        with pytest.raises(ValidationError):
            UpsertEmployeeCompensationRequest(
                base_salary=Decimal("-1.00"),
                hourly_rate=Decimal("100.00"),
            )
