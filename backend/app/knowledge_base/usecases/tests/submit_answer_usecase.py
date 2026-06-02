from typing import Optional
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.db_models import (
    CourseTestModel,
    CourseUserModel,
    TestModel,
    TestTaskAssignmentModel,
    TestTaskModel,
    UserCourseTestModel,
)
from app.knowledge_base.domain import SubmitAnswerRequest, UserContext
from app.knowledge_base.dto import SubmitAnswerResultDTO, TestTaskDTO
from app.users.db_models import UserRole


class SubmitAnswerUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        request: SubmitAnswerRequest,
        ctx: UserContext,
    ) -> Optional[SubmitAnswerResultDTO]:
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

        task: Optional[TestTaskModel] = None
        for ta in test.task_assignments:
            if ta.task and ta.task.id == request.task_id:
                task = ta.task
                break
        if task is None:
            return None

        user_test_result = await self.session.execute(
            select(UserCourseTestModel).where(
                UserCourseTestModel.user_id == ctx.user_id,
                UserCourseTestModel.course_id == request.course_id,
                UserCourseTestModel.test_id == request.test_id,
            )
        )
        user_test = user_test_result.scalar_one_or_none()
        if user_test is None:
            return None
        if user_test.completed_at is not None:
            return None

        is_correct = request.selected_variant == task.correct_variant
        points_earned = task.points if is_correct else 0

        answers = user_test.answers or {}
        previous_answer = answers.get(str(request.task_id))
        if previous_answer is not None:
            return None
        answers[str(request.task_id)] = {
            "selected_variant": request.selected_variant,
            "is_correct": is_correct,
            "points_earned": points_earned,
        }
        user_test.answers = answers
        user_test.score = (user_test.score or 0) + points_earned

        task_ids = [ta.task_id for ta in test.task_assignments]
        current_index = task_ids.index(request.task_id)
        is_last_task = current_index >= len(task_ids) - 1

        if is_last_task:
            user_test.is_passed = user_test.score >= (
                test.pass_score_percent * test.total_points / 100
            )
            user_test.completed_at = datetime.now()

            enrollment_result = await self.session.execute(
                select(CourseUserModel).where(
                    CourseUserModel.user_id == ctx.user_id,
                    CourseUserModel.course_id == request.course_id,
                )
            )
            enrollment = enrollment_result.scalar_one_or_none()
            if enrollment is not None:
                enrollment.user_points_by_course = (
                    enrollment.user_points_by_course or 0
                ) + (user_test.score or 0)
                enrollment.updated_at = datetime.now()

            await self.session.commit()

            return SubmitAnswerResultDTO(
                is_correct=is_correct,
                points_earned=points_earned,
                next_task=None,
                is_test_completed=True,
            )

        next_task_id = task_ids[current_index + 1]
        next_task: Optional[TestTaskDTO] = None
        for ta in test.task_assignments:
            if ta.task and ta.task.id == next_task_id:
                next_task = TestTaskDTO(
                    id=ta.task.id,
                    name=ta.task.name,
                    description=ta.task.description,
                    points=ta.task.points,
                    answer_variants=ta.task.answer_variants,
                )
                break

        await self.session.commit()

        return SubmitAnswerResultDTO(
            is_correct=is_correct,
            points_earned=points_earned,
            next_task=next_task,
            is_test_completed=False,
        )
