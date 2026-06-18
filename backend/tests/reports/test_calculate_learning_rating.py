"""Tests for CalculateLearningRatingUseCase."""
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.reports.usecases.calculate_learning_rating_usecase import CalculateLearningRatingUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestCalculateLearningRating:
    async def test_creates_snapshot_with_items_ranked_by_points(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user_a = await builder.build_user(external_system_id="rating_a", role=UserRole.SELLER)
        user_b = await builder.build_user(external_system_id="rating_b", role=UserRole.SELLER)
        user_c = await builder.build_user(external_system_id="rating_c", role=UserRole.SELLER)

        course = await builder.build_course(rating_points=200)

        await builder.build_course_user(user=user_a, course=course, user_points_by_course=150, is_course_completed_successfully=True)
        await builder.build_course_user(user=user_b, course=course, user_points_by_course=90)
        await builder.build_course_user(user=user_c, course=course, user_points_by_course=200, is_course_completed_successfully=True)

        uc = CalculateLearningRatingUseCase(db_session)
        snapshot = await uc.execute(
            period_from=date(2024, 1, 1),
            period_to=date(2024, 1, 31),
        )

        assert snapshot.id is not None
        assert snapshot.rating_type == "learning"
        assert snapshot.scope_type == "network"
        assert snapshot.scope_id is None

        # Items should be ordered by rank (snapshot.items ordered by rank)
        from sqlalchemy import select
        from app.reports.db_models import RatingSnapshotItemModel

        result = await db_session.execute(
            select(RatingSnapshotItemModel)
            .where(RatingSnapshotItemModel.snapshot_id == snapshot.id)
            .order_by(RatingSnapshotItemModel.rank)
        )
        items = result.scalars().all()
        assert len(items) == 3

        # Highest points → rank 1
        assert items[0].user_id == user_c.id
        assert int(items[0].metric_value) == 200
        assert items[0].rank == 1

        assert items[1].user_id == user_a.id
        assert int(items[1].metric_value) == 150
        assert items[1].rank == 2

        assert items[2].user_id == user_b.id
        assert int(items[2].metric_value) == 90
        assert items[2].rank == 3

    async def test_returns_empty_snapshot_when_no_enrollments(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        uc = CalculateLearningRatingUseCase(db_session)
        snapshot = await uc.execute(
            period_from=date(2024, 2, 1),
            period_to=date(2024, 2, 28),
        )

        assert snapshot.id is not None
        assert snapshot.rating_type == "learning"

        from sqlalchemy import select
        from app.reports.db_models import RatingSnapshotItemModel

        result = await db_session.execute(
            select(RatingSnapshotItemModel).where(
                RatingSnapshotItemModel.snapshot_id == snapshot.id
            )
        )
        assert result.scalars().all() == []

    async def test_multiple_courses_aggregate_points_per_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        user = await builder.build_user(external_system_id="rating_multi", role=UserRole.SELLER)
        course1 = await builder.build_course(rating_points=100)
        course2 = await builder.build_course(rating_points=100)

        await builder.build_course_user(user=user, course=course1, user_points_by_course=80)
        await builder.build_course_user(user=user, course=course2, user_points_by_course=60)

        uc = CalculateLearningRatingUseCase(db_session)
        snapshot = await uc.execute(
            period_from=date(2024, 3, 1),
            period_to=date(2024, 3, 31),
        )

        from sqlalchemy import select
        from app.reports.db_models import RatingSnapshotItemModel

        result = await db_session.execute(
            select(RatingSnapshotItemModel).where(
                RatingSnapshotItemModel.snapshot_id == snapshot.id,
                RatingSnapshotItemModel.user_id == user.id,
            )
        )
        item = result.scalar_one()
        assert int(item.metric_value) == 140  # 80 + 60
