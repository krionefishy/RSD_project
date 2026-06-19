"""Tests for CalculateLearningRatingUseCase."""
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.reports.db_models import RatingSnapshotItemModel
from app.reports.usecases.calculate_learning_rating_usecase import CalculateLearningRatingUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestCalculateLearningRating:
    async def test_creates_snapshot_with_items_ranked_by_period_points(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user_a = await builder.build_user(external_system_id="rating_a", role=UserRole.SELLER)
        user_b = await builder.build_user(external_system_id="rating_b", role=UserRole.SELLER)
        user_c = await builder.build_user(external_system_id="rating_c", role=UserRole.SELLER)

        course = await builder.build_course(rating_points=200)
        test = await builder.build_test()

        await builder.build_user_course_test(
            user=user_a,
            course=course,
            test=test,
            score=150,
            max_score=150,
            is_passed=True,
            completed_at=datetime(2024, 1, 15, 10, 0, 0),
        )
        await builder.build_user_course_test(
            user=user_b,
            course=course,
            test=await builder.build_test(name="Another Test"),
            score=90,
            max_score=100,
            is_passed=False,
            completed_at=datetime(2024, 1, 20, 10, 0, 0),
        )
        await builder.build_user_course_test(
            user=user_c,
            course=course,
            test=await builder.build_test(name="Third Test"),
            score=200,
            max_score=200,
            is_passed=True,
            completed_at=datetime(2024, 1, 18, 10, 0, 0),
        )

        snapshot = await CalculateLearningRatingUseCase(db_session).execute(
            period_from=date(2024, 1, 1),
            period_to=date(2024, 1, 31),
        )

        result = await db_session.execute(
            select(RatingSnapshotItemModel)
            .where(RatingSnapshotItemModel.snapshot_id == snapshot.id)
            .order_by(RatingSnapshotItemModel.rank)
        )
        items = result.scalars().all()
        assert len(items) == 3
        assert items[0].user_id == user_c.id
        assert int(items[0].metric_value) == 200
        assert items[1].user_id == user_a.id
        assert int(items[1].metric_value) == 150
        assert items[2].user_id == user_b.id
        assert int(items[2].metric_value) == 90

    async def test_returns_empty_snapshot_when_no_completed_tests_in_period(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(external_system_id="rating_empty", role=UserRole.SELLER)
        course = await builder.build_course()
        test = await builder.build_test()
        await builder.build_user_course_test(
            user=user,
            course=course,
            test=test,
            score=75,
            max_score=100,
            completed_at=datetime(2024, 1, 10, 10, 0, 0),
        )

        snapshot = await CalculateLearningRatingUseCase(db_session).execute(
            period_from=date(2024, 2, 1),
            period_to=date(2024, 2, 28),
        )

        result = await db_session.execute(
            select(RatingSnapshotItemModel).where(
                RatingSnapshotItemModel.snapshot_id == snapshot.id
            )
        )
        assert result.scalars().all() == []

    async def test_aggregates_multiple_completed_tests_within_period(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(external_system_id="rating_multi", role=UserRole.SELLER)
        course1 = await builder.build_course(rating_points=100)
        course2 = await builder.build_course(rating_points=100, name="Course 2")
        test1 = await builder.build_test(name="Test 1")
        test2 = await builder.build_test(name="Test 2")

        await builder.build_user_course_test(
            user=user,
            course=course1,
            test=test1,
            score=80,
            max_score=100,
            is_passed=True,
            completed_at=datetime(2024, 3, 5, 10, 0, 0),
        )
        await builder.build_user_course_test(
            user=user,
            course=course2,
            test=test2,
            score=60,
            max_score=100,
            is_passed=True,
            completed_at=datetime(2024, 3, 12, 10, 0, 0),
        )

        snapshot = await CalculateLearningRatingUseCase(db_session).execute(
            period_from=date(2024, 3, 1),
            period_to=date(2024, 3, 31),
        )

        result = await db_session.execute(
            select(RatingSnapshotItemModel).where(
                RatingSnapshotItemModel.snapshot_id == snapshot.id,
                RatingSnapshotItemModel.user_id == user.id,
            )
        )
        item = result.scalar_one()
        assert int(item.metric_value) == 140
        assert float(item.secondary_value) == 100.0

    async def test_ignores_tests_outside_selected_period(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(external_system_id="rating_period", role=UserRole.SELLER)
        course = await builder.build_course()
        test = await builder.build_test()

        await builder.build_user_course_test(
            user=user,
            course=course,
            test=test,
            score=40,
            max_score=100,
            completed_at=datetime(2024, 4, 1, 10, 0, 0),
        )
        await builder.build_user_course_test(
            user=user,
            course=await builder.build_course(name="Course 2"),
            test=await builder.build_test(name="Test 2"),
            score=90,
            max_score=100,
            completed_at=datetime(2024, 5, 1, 10, 0, 0),
        )

        snapshot = await CalculateLearningRatingUseCase(db_session).execute(
            period_from=date(2024, 4, 1),
            period_to=date(2024, 4, 30),
        )

        result = await db_session.execute(
            select(RatingSnapshotItemModel).where(
                RatingSnapshotItemModel.snapshot_id == snapshot.id,
                RatingSnapshotItemModel.user_id == user.id,
            )
        )
        item = result.scalar_one()
        assert int(item.metric_value) == 40
