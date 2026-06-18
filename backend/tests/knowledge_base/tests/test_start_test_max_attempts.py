"""Tests for max_attempts enforcement in StartTestUseCase."""

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.db_models import UserCourseTestModel
from app.knowledge_base.domain import StartTestRequest, UserContext
from app.knowledge_base.usecases.tests.start_test_usecase import StartTestUseCase
from app.users.db_models import UserRole
from tests.builder import Builder
from datetime import datetime


class TestStartTestMaxAttempts:
    async def test_blocks_when_max_attempts_exhausted(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="ma_seller_exhausted",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(
            test_kwargs={"max_attempts": 1},
            task_count=1,
        )
        await builder.build_course_user(user=seller, course=course)

        # Simulate a completed attempt
        user_test = await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            is_passed=False,
        )
        # Mark as completed
        await db_session.execute(
            update(UserCourseTestModel)
            .where(UserCourseTestModel.id == user_test.id)
            .values(completed_at=datetime(2024, 1, 1), attempt_number=1)
        )
        await db_session.commit()

        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)

        result = await StartTestUseCase(db_session).execute(request, ctx)

        assert result is None

    async def test_allows_retry_when_max_attempts_not_reached(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="ma_seller_retry",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(
            test_kwargs={"max_attempts": 3},
            task_count=1,
        )
        await builder.build_course_user(user=seller, course=course)

        # Simulate a completed first attempt
        user_test = await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            is_passed=False,
        )
        await db_session.execute(
            update(UserCourseTestModel)
            .where(UserCourseTestModel.id == user_test.id)
            .values(completed_at=datetime(2024, 1, 1), attempt_number=1)
        )
        await db_session.commit()

        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)

        result = await StartTestUseCase(db_session).execute(request, ctx)

        # Retry is allowed
        assert result is not None

    async def test_no_limit_when_max_attempts_is_null(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="ma_seller_no_limit",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(
            test_kwargs={"max_attempts": None},
            task_count=1,
        )
        await builder.build_course_user(user=seller, course=course)

        user_test = await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            is_passed=False,
        )
        await db_session.execute(
            update(UserCourseTestModel)
            .where(UserCourseTestModel.id == user_test.id)
            .values(completed_at=datetime(2024, 1, 1), attempt_number=10)
        )
        await db_session.commit()

        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)

        result = await StartTestUseCase(db_session).execute(request, ctx)

        # No limit → allow
        assert result is not None
