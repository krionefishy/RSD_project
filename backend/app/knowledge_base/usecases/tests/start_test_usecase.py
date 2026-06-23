from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.db_models import (
    CourseMaterialModel,
    CourseTestModel,
    CourseUserModel,
    TestModel,
    TestTaskAssignmentModel,
    UserCourseMaterialModel,
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

        if test.is_final:
            total_materials = (
                await self.session.execute(
                    select(CourseMaterialModel.id).where(CourseMaterialModel.course_id == request.course_id)
                )
            ).scalars().all()
            if total_materials:
                completed_material_ids = (
                    await self.session.execute(
                        select(UserCourseMaterialModel.material_id).where(
                            UserCourseMaterialModel.user_id == ctx.user_id,
                            UserCourseMaterialModel.course_id == request.course_id,
                            UserCourseMaterialModel.is_completed.is_(True),
                        )
                    )
                ).scalars().all()
                if len(set(completed_material_ids)) < len(total_materials):
                    return None

        user_test_result = await self.session.execute(
            select(UserCourseTestModel).where(
                UserCourseTestModel.user_id == ctx.user_id,
                UserCourseTestModel.course_id == request.course_id,
                UserCourseTestModel.test_id == request.test_id,
            )
        )
        user_test = user_test_result.scalar_one_or_none()

        if user_test is not None and user_test.completed_at is not None:
            return None

        now = datetime.now()
        if user_test is None:
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

        answered_task_ids = {
            int(task_id)
            for task_id in (user_test.answers or {}).keys()
            if str(task_id).isdigit()
        }
        next_assignment = next(
            (assignment for assignment in test.task_assignments if assignment.task_id not in answered_task_ids),
            None,
        )
        next_task = next_assignment.task if next_assignment else None
        if next_task is None:
            return None

        return StartTestResultDTO(
            test_id=test.id,
            test_name=test.name,
            tasks_count=test.tasks_count,
            first_task=TestTaskDTO(
                id=next_task.id,
                name=next_task.name,
                description=next_task.description,
                points=next_task.points,
                answer_variants=next_task.answer_variants,
            ),
        )
