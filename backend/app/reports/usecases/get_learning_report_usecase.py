"""Read course_users and produce a per-user learning progress report."""
from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.db_models import CourseModel, CourseUserModel
from app.users.db_models import UserModel


class LearningReportUserItem(BaseModel):
    user_id: str
    user_name: str
    external_system_id: str
    total_courses: int
    completed_courses: int
    total_points: int
    completion_pct: float


class LearningReportDTO(BaseModel):
    items: list[LearningReportUserItem]
    total_users: int
    avg_completion_pct: float


class GetLearningReportUseCase:
    """Return per-user learning progress for all enrolled users."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self) -> LearningReportDTO:
        result = await self.session.execute(
            select(
                CourseUserModel.user_id,
                CourseUserModel.course_id,
                CourseUserModel.user_points_by_course,
                CourseUserModel.is_course_completed_successfully,
            )
        )
        rows = result.all()

        from collections import defaultdict
        user_data: dict[UUID, dict] = defaultdict(lambda: {"points": 0, "total": 0, "completed": 0})
        for row in rows:
            d = user_data[row.user_id]
            d["points"] += row.user_points_by_course or 0
            d["total"] += 1
            if row.is_course_completed_successfully:
                d["completed"] += 1

        if not user_data:
            return LearningReportDTO(items=[], total_users=0, avg_completion_pct=0.0)

        user_ids = list(user_data.keys())
        users_result = await self.session.execute(
            select(UserModel).where(UserModel.id.in_(user_ids))
        )
        users_map = {str(u.id): u for u in users_result.scalars().all()}

        items = []
        for user_id, d in user_data.items():
            user = users_map.get(str(user_id))
            total = d["total"]
            completed = d["completed"]
            pct = round((completed / total * 100), 1) if total > 0 else 0.0
            items.append(
                LearningReportUserItem(
                    user_id=str(user_id),
                    user_name=user.full_name if user else str(user_id),
                    external_system_id=user.external_system_id if user else "",
                    total_courses=total,
                    completed_courses=completed,
                    total_points=d["points"],
                    completion_pct=pct,
                )
            )

        items.sort(key=lambda x: x.total_points, reverse=True)
        avg_pct = round(sum(i.completion_pct for i in items) / len(items), 1)

        return LearningReportDTO(
            items=items,
            total_users=len(items),
            avg_completion_pct=avg_pct,
        )
