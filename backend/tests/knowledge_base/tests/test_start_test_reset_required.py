"""Tests for retry policy in StartTestUseCase."""

from datetime import datetime

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.db_models import UserCourseTestModel
from app.knowledge_base.domain import StartTestRequest, UserContext
from app.knowledge_base.usecases.tests.start_test_usecase import StartTestUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestStartTestResetRequired:
    async def test_blocks_repeat_start_after_completed_attempt(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="retry_after_completed",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(task_count=1)
        await builder.build_course_user(user=seller, course=course)

        user_test = await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            score=10,
            max_score=10,
            is_passed=True,
        )
        await db_session.execute(
            update(UserCourseTestModel)
            .where(UserCourseTestModel.id == user_test.id)
            .values(completed_at=datetime(2024, 1, 1))
        )
        await db_session.commit()

        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)

        result = await StartTestUseCase(db_session).execute(request, ctx)

        assert result is None

    async def test_returns_next_unanswered_task_for_in_progress_attempt(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="resume_in_progress",
            role=UserRole.SELLER,
        )
        course, test, tasks, _ = await builder.build_course_with_test(task_count=2)
        await builder.build_course_user(user=seller, course=course)
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            score=10,
            max_score=20,
            answers={
                str(tasks[0].id): {
                    "selected_variant": tasks[0].correct_variant,
                    "is_correct": True,
                    "points_earned": tasks[0].points,
                }
            },
        )
        await db_session.commit()

        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)

        result = await StartTestUseCase(db_session).execute(request, ctx)

        assert result is not None
        assert result.first_task.id == tasks[1].id
