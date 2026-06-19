from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.reports.db_models import RatingSnapshotItemModel, RatingSnapshotModel
from app.users.db_models import UserModel


class LearningRatingItemDTO(BaseModel):
    rank: int
    user_id: str
    user_name: str
    external_system_id: str
    total_points: float
    metric_display: str
    completion_pct: Optional[float] = None
    completion_display: Optional[str] = None
    block_id: Optional[int] = None
    location_id: Optional[int] = None


class LearningRatingDTO(BaseModel):
    snapshot_id: int
    period_from: date
    period_to: date
    calculated_at: str
    items: list[LearningRatingItemDTO]


class GetLearningRatingUseCase:
    """Return the most recent learning rating snapshot for the given scope."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        scope_type: str = "network",
        scope_id: Optional[int] = None,
        period_from: Optional[date] = None,
        period_to: Optional[date] = None,
    ) -> Optional[LearningRatingDTO]:
        query = (
            select(RatingSnapshotModel)
            .where(
                RatingSnapshotModel.rating_type == "learning",
                RatingSnapshotModel.scope_type == scope_type,
                RatingSnapshotModel.scope_id == scope_id,
            )
            .order_by(RatingSnapshotModel.calculated_at.desc())
            .limit(1)
            .options(
                selectinload(RatingSnapshotModel.items).selectinload(
                    RatingSnapshotItemModel.user
                )
            )
        )
        if period_from is not None and period_to is not None:
            query = query.where(
                RatingSnapshotModel.period_from == period_from,
                RatingSnapshotModel.period_to == period_to,
            )
        snapshot_result = await self.session.execute(query)
        snapshot = snapshot_result.scalar_one_or_none()
        if snapshot is None:
            return None

        items = []
        for item in snapshot.items:
            user: Optional[UserModel] = item.user
            user_name = user.full_name if user else str(item.user_id)
            ext_id = user.external_system_id if user else ""
            items.append(
                LearningRatingItemDTO(
                    rank=item.rank,
                    user_id=str(item.user_id),
                    user_name=user_name,
                    external_system_id=ext_id,
                    total_points=float(item.metric_value),
                    metric_display=item.metric_display,
                    completion_pct=float(item.secondary_value) if item.secondary_value is not None else None,
                    completion_display=item.secondary_display,
                    block_id=item.block_id,
                    location_id=item.location_id,
                )
            )

        return LearningRatingDTO(
            snapshot_id=snapshot.id,
            period_from=snapshot.period_from,
            period_to=snapshot.period_to,
            calculated_at=snapshot.calculated_at.isoformat(),
            items=items,
        )
