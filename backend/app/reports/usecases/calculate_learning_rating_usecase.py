from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy import case, delete, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.db_models import UserCourseTestModel
from app.locations.db_models import BlockLocationModel, BlockMemberModel
from app.reports.db_models import RatingSnapshotItemModel, RatingSnapshotModel
from app.users.db_models import UserModel, UserRole


class CalculateLearningRatingUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        period_from: date,
        period_to: date,
        scope_type: str = "network",
        scope_id: int | None = None,
    ) -> RatingSnapshotModel:
        aggregates = (
            select(
                UserCourseTestModel.user_id,
                func.sum(func.coalesce(UserCourseTestModel.score, 0)).label("total_points"),
                func.count(distinct(UserCourseTestModel.course_id)).label("course_count"),
                func.count(
                    distinct(
                        case(
                            (UserCourseTestModel.is_passed.is_(True), UserCourseTestModel.course_id),
                            else_=None,
                        )
                    )
                ).label("completed_count"),
            )
            .where(
                UserCourseTestModel.completed_at >= datetime.combine(period_from, time.min),
                UserCourseTestModel.completed_at <= datetime.combine(period_to, time.max),
            )
            .group_by(UserCourseTestModel.user_id)
        )

        eligible_users = select(UserModel.id, UserModel.last_name, UserModel.first_name, UserModel.middle_name).where(
            UserModel.role == UserRole.SELLER.value,
            UserModel.is_active.is_(True),
        )

        if scope_type == "block" and scope_id is not None:
            scoped_users = select(BlockMemberModel.user_id).where(
                BlockMemberModel.block_id == scope_id
            )
            eligible_users = eligible_users.where(UserModel.id.in_(scoped_users))
            aggregates = aggregates.where(UserCourseTestModel.user_id.in_(scoped_users))
        elif scope_type == "location" and scope_id is not None:
            location_blocks = select(BlockLocationModel.block_id).where(
                BlockLocationModel.location_id == scope_id
            )
            scoped_users = select(BlockMemberModel.user_id).where(
                BlockMemberModel.block_id.in_(location_blocks)
            )
            eligible_users = eligible_users.where(UserModel.id.in_(scoped_users))
            aggregates = aggregates.where(UserCourseTestModel.user_id.in_(scoped_users))

        eligible_users_subquery = eligible_users.subquery()
        aggregates_subquery = aggregates.subquery()
        leaderboard_query = (
            select(
                UserModel.id.label("user_id"),
                func.coalesce(aggregates_subquery.c.total_points, 0).label("total_points"),
                func.coalesce(aggregates_subquery.c.course_count, 0).label("course_count"),
                func.coalesce(aggregates_subquery.c.completed_count, 0).label("completed_count"),
            )
            .select_from(UserModel)
            .join(eligible_users_subquery, eligible_users_subquery.c.id == UserModel.id)
            .outerjoin(aggregates_subquery, aggregates_subquery.c.user_id == UserModel.id)
            .order_by(
                func.coalesce(aggregates_subquery.c.total_points, 0).desc(),
                func.coalesce(aggregates_subquery.c.completed_count, 0).desc(),
                UserModel.last_name.asc().nullslast(),
                UserModel.first_name.asc().nullslast(),
                UserModel.middle_name.asc().nullslast(),
                UserModel.external_system_id.asc(),
            )
        )
        user_totals_result = await self.session.execute(leaderboard_query)
        rows = user_totals_result.all()

        now = datetime.now()
        existing_ids = (
            select(RatingSnapshotModel.id)
            .where(
                RatingSnapshotModel.rating_type == "learning",
                RatingSnapshotModel.scope_type == scope_type,
                RatingSnapshotModel.scope_id == scope_id,
                RatingSnapshotModel.period_from == period_from,
                RatingSnapshotModel.period_to == period_to,
            )
        )
        await self.session.execute(
            delete(RatingSnapshotModel).where(RatingSnapshotModel.id.in_(existing_ids))
        )
        snapshot = RatingSnapshotModel(
            rating_type="learning",
            scope_type=scope_type,
            scope_id=scope_id,
            period_type="custom",
            period_from=period_from,
            period_to=period_to,
            metric_code="learning_points",
            calculated_at=now,
        )
        self.session.add(snapshot)
        await self.session.flush()  # get snapshot.id

        for rank, row in enumerate(rows, start=1):
            total_points = int(row.total_points or 0)
            completed = int(row.completed_count or 0)
            course_count = int(row.course_count or 0)
            completion_pct = round((completed / course_count * 100), 1) if course_count > 0 else 0.0
            item = RatingSnapshotItemModel(
                snapshot_id=snapshot.id,
                user_id=row.user_id,
                rank=rank,
                metric_value=Decimal(str(total_points)),
                metric_display=f"{total_points} pts",
                secondary_value=Decimal(str(completion_pct)),
                secondary_display=f"{completion_pct}% курсов завершено",
            )
            self.session.add(item)

        await self.session.commit()
        await self.session.refresh(snapshot)
        return snapshot
