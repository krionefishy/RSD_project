from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_CONTENT_VIEW_ALL_ROLES
from app.knowledge_base.db_models import CourseTestModel, CourseUserModel, TestModel, TestTaskAssignmentModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestDTO
from app.users.db_models import UserRole


class GetTestByIdUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        test_id: int,
        course_id: int,
        ctx: UserContext,
    ) -> Optional[TestDTO]:
        if ctx.role.value not in KB_CONTENT_VIEW_ALL_ROLES and ctx.role != UserRole.SELLER:
            return None

        query = (
            select(TestModel)
            .join(CourseTestModel, CourseTestModel.test_id == TestModel.id)
            .where(
                CourseTestModel.course_id == course_id,
                CourseTestModel.test_id == test_id,
            )
            .options(selectinload(TestModel.task_assignments).selectinload(TestTaskAssignmentModel.task))
        )

        if ctx.role == UserRole.SELLER:
            query = query.join(
                CourseUserModel,
                CourseUserModel.course_id == CourseTestModel.course_id,
            ).where(CourseUserModel.user_id == ctx.user_id)

        test_result = await self.session.execute(query)
        test = test_result.scalar_one_or_none()
        if test is None:
            return None

        return TestDTO(
            id=test.id,
            name=test.name,
            category=test.category,
            description=test.description,
            is_final=test.is_final,
            pass_score_percent=test.pass_score_percent,
            tasks_count=test.tasks_count,
            total_points=test.total_points,
            course_id=course_id,
            created_at=test.created_at,
        )
