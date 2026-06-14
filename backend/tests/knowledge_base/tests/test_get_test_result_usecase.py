from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import UserContext
from app.knowledge_base.usecases.tests.get_test_result_usecase import GetTestResultUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetTestResultUseCase:

    async def test_returns_none_for_admin_without_own_result(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.build_user(
            external_system_id="admin_no_result",
            first_name="Admin",
            role=UserRole.ADMIN_EDUCATION,
        )
        seller = await builder.build_user(
            external_system_id="seller_for_admin",
            first_name="Seller",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(task_count=1)
        await builder.build_course_user(user=seller, course=course)
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            score=8,
            max_score=10,
            is_passed=True,
        )
        ctx = UserContext(user_id=admin.id, role=UserRole.ADMIN_EDUCATION)
        usecase = GetTestResultUseCase(db_session)

        result = await usecase.execute(test.id, course.id, ctx)

        assert result is None

    async def test_returns_none_when_test_not_started(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="no_test_result",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(task_count=1)
        await builder.build_course_user(user=seller, course=course)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = GetTestResultUseCase(db_session)

        result = await usecase.execute(test.id, course.id, ctx)

        assert result is None

    async def test_returns_none_for_unassigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="unassigned_result",
            first_name="Bob",
            role=UserRole.SELLER,
        )
        course, test, _, _ = await builder.build_course_with_test(task_count=1)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = GetTestResultUseCase(db_session)

        result = await usecase.execute(test.id, course.id, ctx)

        assert result is None
