from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.timesheets.update_time_entry_usecase import UpdateTimeEntryUseCase
from app.personnel.db_models import ShiftType
from app.personnel.domain import UpdateTimeEntryRequest
from app.users.profile_errors import ProfileConflictError, ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder


class TestUpdateTimeEntryUseCase:
    async def test_updates_hours_and_comment(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        entry = await builder.build_time_entry(hours=Decimal("6.00"))
        ctx = builder.auth_context_for(admin)

        result = await UpdateTimeEntryUseCase(db_session).execute(
            entry.id,
            UpdateTimeEntryRequest(hours=Decimal("7.50"), comment="Corrected"),
            ctx,
        )

        assert result.hours == Decimal("7.50")
        assert result.comment == "Corrected"

    async def test_raises_not_found_for_missing_entry(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileNotFoundError):
            await UpdateTimeEntryUseCase(db_session).execute(
                999999,
                UpdateTimeEntryRequest(hours=Decimal("1.00")),
                ctx,
            )

    async def test_raises_conflict_for_duplicate_shift_on_same_date(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller = await builder.build_user(external_system_id="dup_shift_user")
        work_day = date(2024, 10, 20)
        await builder.build_time_entry(
            user=seller,
            work_date=work_day,
            shift_type=ShiftType.DAY.value,
        )
        second = await builder.build_time_entry(
            user=seller,
            work_date=work_day,
            shift_type=ShiftType.NIGHT.value,
        )
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileConflictError):
            await UpdateTimeEntryUseCase(db_session).execute(
                second.id,
                UpdateTimeEntryRequest(shift_type=ShiftType.DAY.value),
                ctx,
            )

    async def test_raises_validation_when_night_code_without_night_shift(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        await builder.build_activity_code(code="Н", name="Ночь", is_worked_time=True)
        entry = await builder.build_time_entry(shift_type=ShiftType.DAY.value)
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UpdateTimeEntryUseCase(db_session).execute(
                entry.id,
                UpdateTimeEntryRequest(activity_code="Н"),
                ctx,
            )

        assert exc_info.value.status_code == 422

    async def test_raises_validation_when_work_code_without_day_shift(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        entry = await builder.build_time_entry(shift_type=ShiftType.DAY.value)
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UpdateTimeEntryUseCase(db_session).execute(
                entry.id,
                UpdateTimeEntryRequest(shift_type=ShiftType.NONE.value),
                ctx,
            )

        assert exc_info.value.status_code == 422

    async def test_raises_validation_when_absence_has_shift(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        await builder.build_activity_code(
            code="В",
            name="Выходной",
            entry_type="day_off",
            is_worked_time=False,
        )
        entry = await builder.build_time_entry()
        ctx = builder.auth_context_for(admin)

        with pytest.raises(HTTPException) as exc_info:
            await UpdateTimeEntryUseCase(db_session).execute(
                entry.id,
                UpdateTimeEntryRequest(activity_code="В", shift_type=ShiftType.DAY.value),
                ctx,
            )

        assert exc_info.value.status_code == 422

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        entry = await builder.build_time_entry(user=seller)
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await UpdateTimeEntryUseCase(db_session).execute(
                entry.id,
                UpdateTimeEntryRequest(hours=Decimal("1.00")),
                ctx,
            )
