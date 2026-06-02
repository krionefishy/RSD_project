from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_CONTENT_VIEW_ALL_ROLES
from app.knowledge_base.db_models import CourseTestModel, CourseUserModel, UserCourseTestModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestResultDTO
from app.users.db_models import UserRole


class GetTestResultUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        test_id: int,
        course_id: int,
        ctx: UserContext,
    ) -> Optional[TestResultDTO]:
        if ctx.role.value not in KB_CONTENT_VIEW_ALL_ROLES and ctx.role != UserRole.SELLER:
            return None

        query = select(CourseTestModel.id).where(
            CourseTestModel.course_id == course_id,
            CourseTestModel.test_id == test_id,
        )

        if ctx.role == UserRole.SELLER:
            query = query.join(
                CourseUserModel,
                CourseUserModel.course_id == CourseTestModel.course_id,
            ).where(CourseUserModel.user_id == ctx.user_id)

        access_result = await self.session.execute(query)
        if access_result.scalar_one_or_none() is None:
            return None

        user_test_result = await self.session.execute(
            select(UserCourseTestModel)
            .where(
                UserCourseTestModel.user_id == ctx.user_id,
                UserCourseTestModel.course_id == course_id,
                UserCourseTestModel.test_id == test_id,
            )
            .options(selectinload(UserCourseTestModel.test))
        )
        user_test = user_test_result.scalar_one_or_none()

        if user_test is None or user_test.test is None:
            return None

        test = user_test.test
        score = user_test.score or 0
        max_score = user_test.max_score or 0
        percentage = (score / max_score * 100) if max_score > 0 else 0

        return TestResultDTO(
            test_id=test.id,
            test_name=test.name,
            score=score,
            max_score=max_score,
            percentage=round(percentage, 2),
            is_passed=user_test.is_passed,
        )
