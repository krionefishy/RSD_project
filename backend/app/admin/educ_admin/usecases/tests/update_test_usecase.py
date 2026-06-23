from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin.educ_admin.domain import UpdateTestRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseModel, CourseTestModel, TestModel, TestTaskAssignmentModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestDTO


class UpdateTestUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        test_id: int,
        request: UpdateTestRequest,
        ctx: UserContext,
    ) -> Optional[TestDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        test = (
            await self.session.execute(
                select(TestModel)
                .where(TestModel.id == test_id)
                .options(
                    selectinload(TestModel.task_assignments).selectinload(TestTaskAssignmentModel.task),
                    selectinload(TestModel.course_tests),
                )
            )
        ).scalar_one_or_none()
        if test is None:
            return None

        if request.name is not None:
            test.name = request.name.strip()
        if request.category is not None:
            test.category = request.category.strip()
        if request.description is not None:
            test.description = request.description
        if request.is_final is not None:
            test.is_final = request.is_final
            for course_test in test.course_tests or []:
                course_test.is_final = request.is_final
        if request.pass_score_percent is not None:
            test.pass_score_percent = request.pass_score_percent
        if request.time_limit_minutes is not None:
            test.time_limit_minutes = request.time_limit_minutes
        if request.max_attempts is not None:
            test.max_attempts = request.max_attempts
        if request.course_id is not None:
            course = (
                await self.session.execute(select(CourseModel).where(CourseModel.id == request.course_id))
            ).scalar_one_or_none()
            if course is None:
                return None
            existing_link = next((item for item in test.course_tests or [] if item.course_id == request.course_id), None)
            if existing_link is None:
                self.session.add(
                    CourseTestModel(
                        course_id=request.course_id,
                        test_id=test.id,
                        is_final=test.is_final,
                    )
                )

        course_id = test.course_tests[0].course_id if test.course_tests else 0
        tasks_count = test.tasks_count
        total_points = test.total_points
        await self.session.commit()
        await self.session.refresh(test)

        return TestDTO(
            id=test.id,
            name=test.name,
            category=test.category,
            description=test.description,
            is_final=test.is_final,
            pass_score_percent=test.pass_score_percent,
            time_limit_minutes=test.time_limit_minutes,
            max_attempts=test.max_attempts,
            tasks_count=tasks_count,
            total_points=total_points,
            course_id=course_id,
            created_at=test.created_at,
        )
