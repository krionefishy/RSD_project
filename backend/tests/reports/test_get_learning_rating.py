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
        result = await GetLearningRatingUseCase(db_session).execute(scope_type="network", scope_id=None)
        assert result is None

    async def test_returns_latest_snapshot_for_period(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(external_system_id="get_rating_u1", role=UserRole.SELLER)
        course = await builder.build_course(rating_points=100)
        test = await builder.build_test()
        await builder.build_user_course_test(
            user=user,
            course=course,
            test=test,
            score=75,
            max_score=100,
            is_passed=True,
            completed_at=datetime(2024, 1, 20, 10, 0, 0),
        )

        snap = await CalculateLearningRatingUseCase(db_session).execute(
            period_from=date(2024, 1, 1),
            period_to=date(2024, 1, 31),
        )

        result = await GetLearningRatingUseCase(db_session).execute(
            scope_type="network",
            scope_id=None,
            period_from=date(2024, 1, 1),
            period_to=date(2024, 1, 31),
        )

        assert result is not None
        assert result.snapshot_id == snap.id
        assert len(result.items) == 1
        assert result.items[0].rank == 1
        assert result.items[0].total_points == 75.0
        assert str(result.items[0].user_id) == str(user.id)

    async def test_returns_none_when_period_snapshot_missing(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(external_system_id="get_rating_missing", role=UserRole.SELLER)
        course = await builder.build_course(rating_points=100)
        test = await builder.build_test()
        await builder.build_user_course_test(
            user=user,
            course=course,
            test=test,
            score=50,
            max_score=100,
            is_passed=True,
            completed_at=datetime(2024, 2, 10, 10, 0, 0),
        )

        await CalculateLearningRatingUseCase(db_session).execute(
            period_from=date(2024, 2, 1),
            period_to=date(2024, 2, 28),
        )

        result = await GetLearningRatingUseCase(db_session).execute(
            period_from=date(2024, 3, 1),
            period_to=date(2024, 3, 31),
        )
        assert result is None

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
        test = await builder.build_test()
        await builder.build_user_course_test(
            user=user,
            course=course,
            test=test,
            score=50,
            max_score=100,
            is_passed=True,
            completed_at=datetime(2024, 2, 10, 10, 0, 0),
        )

        await CalculateLearningRatingUseCase(db_session).execute(
            period_from=date(2024, 2, 1),
            period_to=date(2024, 2, 28),
        )

        result = await GetLearningRatingUseCase(db_session).execute()
        assert result is not None
        item = result.items[0]
        assert "Иван" in item.user_name or "Иванов" in item.user_name
