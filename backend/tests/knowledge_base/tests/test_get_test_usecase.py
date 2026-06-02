from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import UserContext
from app.knowledge_base.usecases.tests.get_test_usecase import GetTestByIdUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetTestByIdUseCase:
    async def test_returns_test_for_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        course, test, _, course_test = await builder.build_course_with_test(task_count=3)
        ctx = UserContext(user_id=uuid4(), role=UserRole.ADMIN_EDUCATION)
        usecase = GetTestByIdUseCase(db_session)

        result = await usecase.execute(test.id, course.id, ctx)

        assert result is not None
        assert result.id == test.id
        assert result.tasks_count == 3
        assert result.course_id == course.id


    async def test_returns_none_for_unassigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="unassigned_test",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(task_count=1)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = GetTestByIdUseCase(db_session)

        result = await usecase.execute(test.id, course.id, ctx)

        assert result is None

    async def test_returns_none_for_nonexistent_test(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        course = await builder.build_course()
        ctx = UserContext(user_id=uuid4(), role=UserRole.ADMIN_EDUCATION)
        usecase = GetTestByIdUseCase(db_session)

        result = await usecase.execute(99999, course.id, ctx)

        assert result is None
