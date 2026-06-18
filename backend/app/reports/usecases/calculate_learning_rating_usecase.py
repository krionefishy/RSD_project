from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.db_models import CourseUserModel
from app.locations.db_models import BlockLocationModel, BlockMemberModel
from app.reports.db_models import RatingSnapshotItemModel, RatingSnapshotModel


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
        base_query = (
            select(
                CourseUserModel.user_id,
                func.sum(CourseUserModel.user_points_by_course).label("total_points"),
                func.count(CourseUserModel.course_id).label("course_count"),
                func.sum(
                    CourseUserModel.is_course_completed_successfully.cast(Integer)
                ).label("completed_count"),
            )
            .group_by(CourseUserModel.user_id)
            .order_by(func.sum(CourseUserModel.user_points_by_course).desc())
        )

        if scope_type == "block" and scope_id is not None:
            scoped_users = select(BlockMemberModel.user_id).where(
                BlockMemberModel.block_id == scope_id
            )
            base_query = base_query.where(CourseUserModel.user_id.in_(scoped_users))
        elif scope_type == "location" and scope_id is not None:
            location_blocks = select(BlockLocationModel.block_id).where(
                BlockLocationModel.location_id == scope_id
            )
            scoped_users = select(BlockMemberModel.user_id).where(
                BlockMemberModel.block_id.in_(location_blocks)
            )
            base_query = base_query.where(CourseUserModel.user_id.in_(scoped_users))

        user_totals_result = await self.session.execute(base_query)
        rows = user_totals_result.all()

        now = datetime.now()
        snapshot = RatingSnapshotModel(
            rating_type="learning",
            scope_type=scope_type,
            scope_id=scope_id,
            period_type="custom",
            period_from=period_from,
            period_to=period_to,
            metric_code="total_learning_points",
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
