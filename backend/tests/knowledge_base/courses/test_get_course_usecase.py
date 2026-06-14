from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import UserContext
from app.knowledge_base.usecases.courses.get_course_usecase import GetCourseByIdUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetCourseByIdUseCase:
    async def test_returns_course_for_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        course, materials, _ = await builder.build_course_with_materials(
            course_kwargs={"name": "Test Course"},
            material_count=2,
        )
        ctx = UserContext(user_id=uuid4(), role=UserRole.ADMIN_EDUCATION)
        usecase = GetCourseByIdUseCase(db_session)

        result = await usecase.execute(course.id, ctx)

        assert result is not None
        assert result.name == "Test Course"
        assert result.materials_count == 2

    async def test_returns_course_for_assigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="seller_course",
            first_name="John",
            role=UserRole.SELLER,
        )
        course, _, _ = await builder.build_course_with_materials(material_count=1)
        await builder.build_course_user(user=seller, course=course)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = GetCourseByIdUseCase(db_session)

        result = await usecase.execute(course.id, ctx)

        assert result is not None
        assert result.id == course.id

    async def test_returns_none_for_unassigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="unassigned_seller",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        course = await builder.build_course(name="Private Course")
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = GetCourseByIdUseCase(db_session)

        result = await usecase.execute(course.id, ctx)

        assert result is None

    async def test_returns_none_for_nonexistent_course(
        self,
        db_session: AsyncSession,
    ) -> None:
        ctx = UserContext(user_id=uuid4(), role=UserRole.ADMIN_EDUCATION)
        usecase = GetCourseByIdUseCase(db_session)

        result = await usecase.execute(99999, ctx)

        assert result is None
