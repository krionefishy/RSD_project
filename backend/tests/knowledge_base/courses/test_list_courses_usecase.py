from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import UserContext
from app.knowledge_base.usecases.courses.list_courses_usecase import ListCoursesUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestListCoursesUseCase:
    async def test_returns_all_courses_for_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        course1 = await builder.build_course(name="Course 1")
        course2 = await builder.build_course(name="Course 2")
        ctx = UserContext(user_id=uuid4(), role=UserRole.ADMIN_EDUCATION)
        usecase = ListCoursesUseCase(db_session)

        result = await usecase.execute(ctx)

        assert result is not None
        assert len(result.items) == 2
        assert {item.name for item in result.items} == {"Course 1", "Course 2"}

    async def test_returns_assigned_courses_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="seller_courses",
            first_name="John",
            role=UserRole.SELLER,
        )
        assigned_course = await builder.build_course(name="Assigned Course")
        unassigned_course = await builder.build_course(name="Unassigned Course")
        await builder.build_course_user(user=seller, course=assigned_course)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = ListCoursesUseCase(db_session)

        result = await usecase.execute(ctx)

        assert result is not None
        assert len(result.items) == 1
        assert result.items[0].name == "Assigned Course"

    async def test_returns_empty_list_for_manager_role(
        self,
        db_session: AsyncSession,
    ) -> None:
        ctx = UserContext(user_id=uuid4(), role=UserRole.MANAGER)
        usecase = ListCoursesUseCase(db_session)

        result = await usecase.execute(ctx)

        assert result is not None
        assert len(result.items) == 0

    async def test_returns_empty_list_when_no_courses(
        self,
        db_session: AsyncSession,
    ) -> None:
        ctx = UserContext(user_id=uuid4(), role=UserRole.ADMIN_EDUCATION)
        usecase = ListCoursesUseCase(db_session)

        result = await usecase.execute(ctx)

        assert result is not None
        assert len(result.items) == 0
