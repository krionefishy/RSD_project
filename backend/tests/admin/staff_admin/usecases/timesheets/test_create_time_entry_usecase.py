from datetime import date, time
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.timesheets.create_time_entry_usecase import CreateTimeEntryUseCase
from app.personnel.domain import CreateTimeEntryRequest
from app.users.profile_errors import ProfileConflictError
from tests.builder import Builder


class TestCreateTimeEntryUseCase:
    async def test_creates_shift_from_location_hours(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller, location, _ = await builder.build_user_with_location(
            user_kwargs={"external_system_id": "manual_shift_seller"},
            location_kwargs={"code": "MANUAL-SHIFT", "name": "Manual Shift"},
        )
        location.s2_start_at = time(16, 0)
        location.s2_end_at = time(0, 0)
        await builder.default_activity_code
        await db_session.commit()
        ctx = builder.auth_context_for(admin)

        result = await CreateTimeEntryUseCase(db_session).execute(
            CreateTimeEntryRequest(
                user_id=seller.id,
                work_date=date(2026, 6, 15),
                shift_code="С2",
            ),
            ctx,
        )

        assert result.user_id == seller.id
        assert result.work_date == date(2026, 6, 15)
        assert result.shift_code == "С2"
        assert result.starts_at == "16:00"
        assert result.ends_at == "00:00"
        assert result.hours == Decimal("8.00")

    async def test_creates_both_shifts_on_same_date(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller, location, _ = await builder.build_user_with_location(
            user_kwargs={"external_system_id": "dual_shift_seller"},
            location_kwargs={"code": "DUAL-SHIFT", "name": "Dual Shift"},
        )
        await builder.default_activity_code
        await db_session.commit()
        ctx = builder.auth_context_for(admin)
        usecase = CreateTimeEntryUseCase(db_session)

        first = await usecase.execute(
            CreateTimeEntryRequest(
                user_id=seller.id,
                work_date=date(2026, 6, 15),
                shift_code="С2",
            ),
            ctx,
        )
        second = await usecase.execute(
            CreateTimeEntryRequest(
                user_id=seller.id,
                work_date=date(2026, 6, 15),
                shift_code="С1",
            ),
            ctx,
        )

        assert first.id != second.id
        assert first.shift_code == "С2"
        assert second.shift_code == "С1"
        assert second.starts_at == location.s1_start_at.strftime("%H:%M")

    async def test_raises_conflict_when_same_shift_already_assigned(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        seller, _, _ = await builder.build_user_with_location(
            user_kwargs={"external_system_id": "duplicate_shift_seller"},
            location_kwargs={"code": "DUP-SHIFT", "name": "Duplicate Shift"},
        )
        await builder.default_activity_code
        await db_session.commit()
        ctx = builder.auth_context_for(admin)
        usecase = CreateTimeEntryUseCase(db_session)

        await usecase.execute(
            CreateTimeEntryRequest(
                user_id=seller.id,
                work_date=date(2026, 6, 15),
                shift_code="С2",
            ),
            ctx,
        )

        with pytest.raises(ProfileConflictError):
            await usecase.execute(
                CreateTimeEntryRequest(
                    user_id=seller.id,
                    work_date=date(2026, 6, 15),
                    shift_code="С2",
                ),
                ctx,
            )
