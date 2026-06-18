"""Tests for GetLearningRatingUseCase."""
from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.reports.usecases.calculate_learning_rating_usecase import CalculateLearningRatingUseCase
from app.reports.usecases.get_learning_rating_usecase import GetLearningRatingUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetLearningRating:
    async def test_returns_none_when_no_snapshot_exists(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        uc = GetLearningRatingUseCase(db_session)
        result = await uc.execute(scope_type="network", scope_id=None)
        assert result is None

    async def test_returns_latest_snapshot(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(external_system_id="get_rating_u1", role=UserRole.SELLER)
        course = await builder.build_course(rating_points=100)
        await builder.build_course_user(user=user, course=course, user_points_by_course=75)

        calc_uc = CalculateLearningRatingUseCase(db_session)
        snap = await calc_uc.execute(period_from=date(2024, 1, 1), period_to=date(2024, 1, 31))

        get_uc = GetLearningRatingUseCase(db_session)
        result = await get_uc.execute(scope_type="network", scope_id=None)

        assert result is not None
        assert result.snapshot_id == snap.id
        assert len(result.items) == 1
        assert result.items[0].rank == 1
        assert result.items[0].total_points == 75.0
        assert str(result.items[0].user_id) == str(user.id)

    async def test_returns_items_with_user_name(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(
            external_system_id="get_rating_named",
            role=UserRole.SELLER,
            first_name="Иван",
            last_name="Иванов",
        )
        course = await builder.build_course(rating_points=100)
        await builder.build_course_user(user=user, course=course, user_points_by_course=50)

        await CalculateLearningRatingUseCase(db_session).execute(
            period_from=date(2024, 2, 1),
            period_to=date(2024, 2, 28),
        )

        result = await GetLearningRatingUseCase(db_session).execute()
        assert result is not None
        item = result.items[0]
        assert "Иван" in item.user_name or "Иванов" in item.user_name

    async def test_multiple_recalculations_returns_latest(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(external_system_id="get_rating_latest", role=UserRole.SELLER)
        course = await builder.build_course(rating_points=100)
        await builder.build_course_user(user=user, course=course, user_points_by_course=40)

        calc_uc = CalculateLearningRatingUseCase(db_session)
        snap1 = await calc_uc.execute(period_from=date(2024, 3, 1), period_to=date(2024, 3, 31))
        snap2 = await calc_uc.execute(period_from=date(2024, 4, 1), period_to=date(2024, 4, 30))

        get_uc = GetLearningRatingUseCase(db_session)
        result = await get_uc.execute(scope_type="network", scope_id=None)

        assert result is not None
        # Should return the last snapshot
        assert result.snapshot_id == snap2.id
