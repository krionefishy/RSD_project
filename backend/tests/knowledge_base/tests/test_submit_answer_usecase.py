from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import SubmitAnswerRequest, UserContext
from app.knowledge_base.usecases.tests.submit_answer_usecase import SubmitAnswerUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestSubmitAnswerUseCase:
    async def test_submits_correct_answer_and_returns_next_task(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="submit_seller",
            first_name="John",
            role=UserRole.SELLER,
        )
        course, test, tasks, _ = await builder.build_course_with_test(task_count=2)
        await builder.build_course_user(user=seller, course=course)
        await builder.build_user_course_test(user=seller, course=course, test=test)
        request = SubmitAnswerRequest(
            course_id=course.id,
            test_id=test.id,
            task_id=tasks[0].id,
            selected_variant=0,
        )
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = SubmitAnswerUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is not None
        assert result.is_correct is True
        assert result.points_earned == 10
        assert result.is_test_completed is False
        assert result.next_task is not None
        assert result.next_task.id == tasks[1].id

    async def test_submits_incorrect_answer(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="wrong_answer",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        course, test, tasks, _ = await builder.build_course_with_test(task_count=2)
        await builder.build_course_user(user=seller, course=course)
        await builder.build_user_course_test(user=seller, course=course, test=test)
        request = SubmitAnswerRequest(
            course_id=course.id,
            test_id=test.id,
            task_id=tasks[0].id,
            selected_variant=1,
        )
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = SubmitAnswerUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is not None
        assert result.is_correct is False
        assert result.points_earned == 0

    async def test_completes_test_on_last_task(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="complete_test",
            first_name="Bob",
            role=UserRole.SELLER,
        )
        course, test, tasks, _ = await builder.build_course_with_test(
            task_count=1,
            test_kwargs={"pass_score_percent": 0},
        )
        await builder.build_course_user(user=seller, course=course)
        await builder.build_user_course_test(user=seller, course=course, test=test)
        request = SubmitAnswerRequest(
            course_id=course.id,
            test_id=test.id,
            task_id=tasks[0].id,
            selected_variant=0,
        )
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = SubmitAnswerUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is not None
        assert result.is_test_completed is True
        assert result.next_task is None

    async def test_returns_none_for_non_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.build_user(
            external_system_id="manager_submit",
            first_name="Manager",
            role=UserRole.MANAGER,
        )
        course, test, tasks, _ = await builder.build_course_with_test(task_count=1)
        request = SubmitAnswerRequest(
            course_id=course.id,
            test_id=test.id,
            task_id=tasks[0].id,
            selected_variant=0,
        )
        ctx = UserContext(user_id=manager.id, role=UserRole.MANAGER)
        usecase = SubmitAnswerUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is None

    async def test_returns_none_for_unassigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="unassigned_submit",
            first_name="Unassigned",
            role=UserRole.SELLER,
        )
        course, test, tasks, _ = await builder.build_course_with_test(task_count=1)
        request = SubmitAnswerRequest(
            course_id=course.id,
            test_id=test.id,
            task_id=tasks[0].id,
            selected_variant=0,
        )
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = SubmitAnswerUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is None
