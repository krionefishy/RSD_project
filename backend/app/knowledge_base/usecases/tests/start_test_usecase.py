from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.db_models import (
    CourseTestModel,
    CourseUserModel,
    TestModel,
    TestTaskAssignmentModel,
    UserCourseTestModel,
)
from app.knowledge_base.domain import StartTestRequest, UserContext
from app.knowledge_base.dto import StartTestResultDTO, TestTaskDTO
from app.users.db_models import UserRole


class StartTestUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        request: StartTestRequest,
        ctx: UserContext,
    ) -> Optional[StartTestResultDTO]:
        if ctx.role != UserRole.SELLER:
            return None

        access_result = await self.session.execute(
            select(CourseTestModel.id)
            .join(
                CourseUserModel,
                CourseUserModel.course_id == CourseTestModel.course_id,
            )
            .where(
                CourseTestModel.course_id == request.course_id,
                CourseTestModel.test_id == request.test_id,
                CourseUserModel.user_id == ctx.user_id,
            )
        )
        if access_result.scalar_one_or_none() is None:
            return None

        course_user_result = await self.session.execute(
            select(CourseUserModel.is_course_completed).where(
                CourseUserModel.user_id == ctx.user_id,
                CourseUserModel.course_id == request.course_id,
            )
        )
        is_course_completed = course_user_result.scalar_one_or_none()
        if is_course_completed:
            return None

        test_result = await self.session.execute(
            select(TestModel)
            .where(TestModel.id == request.test_id)
            .options(
                selectinload(TestModel.task_assignments).selectinload(
                    TestTaskAssignmentModel.task
                ),
            )
        )
        test = test_result.unique().scalar_one_or_none()
        if test is None or not test.task_assignments:
            return None

        user_test_result = await self.session.execute(
            select(UserCourseTestModel).where(
                UserCourseTestModel.user_id == ctx.user_id,
                UserCourseTestModel.course_id == request.course_id,
                UserCourseTestModel.test_id == request.test_id,
            )
        )
        user_test = user_test_result.scalar_one_or_none()

        now = datetime.now()
        if user_test is not None and user_test.completed_at is not None:
            if test.max_attempts is not None and user_test.attempt_number >= test.max_attempts:
                return None
            user_test.attempt_number += 1
            user_test.score = 0
            user_test.max_score = test.total_points
            user_test.is_passed = False
            user_test.answers = {}
            user_test.completed_at = None
            user_test.started_at = now
            await self.session.commit()
        elif user_test is not None:
            pass
        else:
            user_test = UserCourseTestModel(
                user_id=ctx.user_id,
                course_id=request.course_id,
                test_id=request.test_id,
                attempt_number=1,
                score=0,
                max_score=test.total_points,
                is_passed=False,
                answers={},
                started_at=now,
            )
            self.session.add(user_test)
            await self.session.commit()

        first_assignment = test.task_assignments[0]
        first_task = first_assignment.task if first_assignment else None
        if first_task is None:
            return None

        return StartTestResultDTO(
            test_id=test.id,
            test_name=test.name,
            tasks_count=test.tasks_count,
            first_task=TestTaskDTO(
                id=first_task.id,
                name=first_task.name,
                description=first_task.description,
                points=first_task.points,
                answer_variants=first_task.answer_variants,
            ),
        )
