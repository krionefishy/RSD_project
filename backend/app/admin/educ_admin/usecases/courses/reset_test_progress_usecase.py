from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseTestModel, CourseUserModel, UserCourseTestModel
from app.knowledge_base.domain import UserContext


class ResetTestProgressUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        user_id,
        test_id: int,
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

        link = (
            await self.session.execute(
                select(CourseTestModel).where(
                    CourseTestModel.course_id == course_id,
                    CourseTestModel.test_id == test_id,
                )
            )
        ).scalar_one_or_none()
        if link is None:
            return None

        await self.session.execute(
            delete(UserCourseTestModel).where(
                UserCourseTestModel.course_id == course_id,
                UserCourseTestModel.user_id == user_id,
                UserCourseTestModel.test_id == test_id,
            )
        )
        await self.session.commit()
        return True
