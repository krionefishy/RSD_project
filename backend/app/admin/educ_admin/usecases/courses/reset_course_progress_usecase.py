from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import (
    CourseUserModel,
    UserCourseMaterialModel,
    UserCourseTestModel,
)
from app.knowledge_base.domain import UserContext


class ResetCourseProgressUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        user_id,
        ctx: UserContext,
    ) -> Optional[bool]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        enrollment = (
            await self.session.execute(
                select(CourseUserModel).where(
                    CourseUserModel.course_id == course_id,
                    CourseUserModel.user_id == user_id,
                )
            )
        ).scalar_one_or_none()
        if enrollment is None:
            return None

        await self.session.execute(
            delete(UserCourseMaterialModel).where(
                UserCourseMaterialModel.course_id == course_id,
                UserCourseMaterialModel.user_id == user_id,
            )
        )
        await self.session.execute(
            delete(UserCourseTestModel).where(
                UserCourseTestModel.course_id == course_id,
                UserCourseTestModel.user_id == user_id,
            )
        )
        enrollment.user_points_by_course = 0
        enrollment.is_course_completed = False
        enrollment.is_course_completed_successfully = False
        await self.session.commit()
        return True
