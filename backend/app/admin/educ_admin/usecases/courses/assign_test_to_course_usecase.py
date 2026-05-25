from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin.educ_admin.domain import AssignTestToCourseRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseModel, CourseTestModel, TestModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseTestItemDTO


class AssignTestToCourseUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        request: AssignTestToCourseRequest,
        ctx: UserContext,
    ) -> Optional[CourseTestItemDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        course = (
            await self.session.execute(select(CourseModel).where(CourseModel.id == course_id))
        ).scalar_one_or_none()
        test = (
            await self.session.execute(
                select(TestModel)
                .where(TestModel.id == request.test_id)
                .options(selectinload(TestModel.task_assignments))
            )
        ).scalar_one_or_none()
        if course is None or test is None:
            return None

        existing = (
            await self.session.execute(
                select(CourseTestModel).where(
                    CourseTestModel.course_id == course_id,
                    CourseTestModel.test_id == request.test_id,
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            return CourseTestItemDTO(
                id=existing.id,
                test_id=test.id,
                name=test.name,
                category=test.category,
                is_final=existing.is_final,
                tasks_count=test.tasks_count,
                is_passed=False,
                score=None,
            )

        link = CourseTestModel(
            course_id=course_id,
            test_id=request.test_id,
            is_final=request.is_final,
        )
        self.session.add(link)
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            return None
        await self.session.refresh(link)

        return CourseTestItemDTO(
            id=link.id,
            test_id=test.id,
            name=test.name,
            category=test.category,
            is_final=link.is_final,
            tasks_count=test.tasks_count,
            is_passed=False,
            score=None,
        )
