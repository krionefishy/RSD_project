"""Tests for GetEmployeeEarningsUseCase, CreateHourlyEarningEventsUseCase, and RecalculateEarningTotalsUseCase."""
from datetime import date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.personnel.db_models import ShiftType
from app.personnel.usecases.create_hourly_earning_events_usecase import CreateHourlyEarningEventsUseCase
from app.personnel.usecases.get_employee_earnings_usecase import GetEmployeeEarningsUseCase
from app.personnel.usecases.recalculate_earning_totals_usecase import RecalculateEarningTotalsUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetEmployeeEarningsUseCase:
    async def test_returns_empty_when_no_totals(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="earn_empty_u1", role=UserRole.SELLER)
        ctx = builder.auth_context_for(seller)

        result = await GetEmployeeEarningsUseCase(db_session).execute(seller.id, ctx)

        assert result.user_id == str(seller.id)
        assert result.months == []
        assert result.total_ytd == 0.0

    async def test_returns_own_totals(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="earn_own_u1", role=UserRole.SELLER)
        ctx = builder.auth_context_for(seller)

        # Create hourly events + recalculate
        await builder.build_employee_compensation(user=seller, hourly_rate=Decimal("200.00"))
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 5, 10),
            hours=Decimal("8.00"),
            shift_type=ShiftType.DAY.value,
        )

        await CreateHourlyEarningEventsUseCase(db_session).execute(seller.id, 2024, 5)
        await RecalculateEarningTotalsUseCase(db_session).execute(seller.id, 2024, 5)

        result = await GetEmployeeEarningsUseCase(db_session).execute(seller.id, ctx)

        assert len(result.months) == 1
        assert result.months[0].year == 2024
        assert result.months[0].month == 5
        assert result.months[0].hourly_amount == 1600.0  # 200 * 8
        assert result.total_ytd == 1600.0


class TestCreateHourlyEarningEvents:
    async def test_creates_events_for_work_entries(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="earn_events_u1", role=UserRole.SELLER)
        await builder.build_employee_compensation(user=seller, hourly_rate=Decimal("300.00"))
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 6, 1),
            hours=Decimal("8.00"),
            shift_type=ShiftType.DAY.value,
        )

        count = await CreateHourlyEarningEventsUseCase(db_session).execute(seller.id, 2024, 6)

        assert count == 1

    async def test_idempotent_skips_already_processed_entries(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="earn_idem_u1", role=UserRole.SELLER)
        await builder.build_employee_compensation(user=seller, hourly_rate=Decimal("300.00"))
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 7, 5),
            hours=Decimal("8.00"),
            shift_type=ShiftType.DAY.value,
        )

        first_count = await CreateHourlyEarningEventsUseCase(db_session).execute(seller.id, 2024, 7)
        second_count = await CreateHourlyEarningEventsUseCase(db_session).execute(seller.id, 2024, 7)

        assert first_count == 1
        assert second_count == 0

    async def test_skips_user_without_compensation(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="earn_nocomp_u1", role=UserRole.SELLER)
        # No compensation record

        count = await CreateHourlyEarningEventsUseCase(db_session).execute(seller.id, 2024, 8)

        assert count == 0

    async def test_night_shift_uses_night_rate(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="earn_night_u1", role=UserRole.SELLER)
        await builder.build_employee_compensation(
            user=seller,
            hourly_rate=Decimal("200.00"),
            night_hourly_rate=Decimal("300.00"),
        )
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 9, 2),
            hours=Decimal("8.00"),
            shift_type=ShiftType.NIGHT.value,
        )

        count = await CreateHourlyEarningEventsUseCase(db_session).execute(seller.id, 2024, 9)
        assert count == 1

        await RecalculateEarningTotalsUseCase(db_session).execute(seller.id, 2024, 9)
        result = await GetEmployeeEarningsUseCase(db_session).execute(
            seller.id, builder.auth_context_for(seller)
        )
        assert result.months[0].hourly_amount == 2400.0  # 300 * 8


class TestRecalculateEarningTotals:
    async def test_creates_total_row(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="earn_total_u1", role=UserRole.SELLER)
        await builder.build_employee_compensation(user=seller, hourly_rate=Decimal("100.00"))
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 10, 15),
            hours=Decimal("5.00"),
            shift_type=ShiftType.DAY.value,
        )

        await CreateHourlyEarningEventsUseCase(db_session).execute(seller.id, 2024, 10)
        total = await RecalculateEarningTotalsUseCase(db_session).execute(seller.id, 2024, 10)

        assert total.year == 2024
        assert total.month == 10
        assert total.hourly_amount == Decimal("500.00")  # 100 * 5
        assert total.total_amount == Decimal("500.00")

    async def test_recalculate_updates_existing_total(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(external_system_id="earn_update_u1", role=UserRole.SELLER)
        await builder.build_employee_compensation(user=seller, hourly_rate=Decimal("100.00"))
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 11, 5),
            hours=Decimal("4.00"),
            shift_type=ShiftType.DAY.value,
        )

        await CreateHourlyEarningEventsUseCase(db_session).execute(seller.id, 2024, 11)
        first_total = await RecalculateEarningTotalsUseCase(db_session).execute(seller.id, 2024, 11)
        assert first_total.hourly_amount == Decimal("400.00")

        # Add another entry (different date) and recalculate again
        code = await builder.default_activity_code
        await builder.build_time_entry(
            user=seller,
            work_date=date(2024, 11, 6),
            hours=Decimal("6.00"),
            activity_code=code.code,
            shift_type=ShiftType.DAY.value,
        )
        await CreateHourlyEarningEventsUseCase(db_session).execute(seller.id, 2024, 11)
        second_total = await RecalculateEarningTotalsUseCase(db_session).execute(seller.id, 2024, 11)

        assert second_total.hourly_amount == Decimal("1000.00")  # (4+6) * 100
