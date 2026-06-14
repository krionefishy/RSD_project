from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import StartTestRequest, UserContext
from app.knowledge_base.usecases.tests.start_test_usecase import StartTestUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestStartTestUseCase:
    async def test_starts_test_for_assigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="start_test_seller",
            first_name="John",
            role=UserRole.SELLER,
        )
        course, test, tasks, _ = await builder.build_course_with_test(task_count=3)
        await builder.build_course_user(user=seller, course=course)
        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = StartTestUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is not None
        assert result.test_id == test.id
        assert result.test_name == test.name
        assert result.tasks_count == 3
        assert result.first_task is not None
        assert result.first_task.id == tasks[0].id

    async def test_returns_none_for_non_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.build_user(
            external_system_id="manager_start",
            first_name="Manager",
            role=UserRole.MANAGER,
        )
        course, test, _, _ = await builder.build_course_with_test(task_count=1)
        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=manager.id, role=UserRole.MANAGER)
        usecase = StartTestUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is None

    async def test_returns_none_for_unassigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="unassigned_start",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(task_count=1)
        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = StartTestUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is None

    async def test_returns_none_when_course_already_completed(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="completed_course",
            first_name="Done",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(task_count=1)
        await builder.build_course_user(
            user=seller,
            course=course,
            is_course_completed=True,
        )
        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = StartTestUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is None
