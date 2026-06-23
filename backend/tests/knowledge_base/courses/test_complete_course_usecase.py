from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import CompleteCourseRequest, UserContext
from app.knowledge_base.usecases.courses.complete_course_usecase import CompleteCourseUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestCompleteCourseUseCase:
    async def test_completes_course_when_requirements_met(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="complete_seller",
            first_name="John",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(
            course_kwargs={"mrp": 10},
            material_count=1,
        )
        test = await builder.build_test(name="Course Test")
        await builder.build_course_test(course=course, test=test)
        await builder.build_course_user(
            user=seller,
            course=course,
            user_points_by_course=10,
        )
        await builder.build_user_course_material(
            user=seller,
            course=course,
            material=materials[0],
            is_completed=True,
        )
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            score=10,
            is_passed=True,
        )
        request = CompleteCourseRequest(course_id=course.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = CompleteCourseUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is not None
        assert result.completed is True
        assert result.message == "Курс успешно завершён!"

    async def test_recalculates_points_from_completed_tests_before_completion_check(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="complete_recalc_points",
            first_name="John",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(
            course_kwargs={"mrp": 5},
            material_count=2,
        )
        test = await builder.build_test(name="Course Test")
        await builder.build_course_test(course=course, test=test)
        await builder.build_course_user(
            user=seller,
            course=course,
            user_points_by_course=0,
        )
        for material in materials:
            await builder.build_user_course_material(
                user=seller,
                course=course,
                material=material,
                is_completed=True,
            )
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            score=10,
            max_score=10,
            is_passed=True,
        )
        request = CompleteCourseRequest(course_id=course.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = CompleteCourseUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is not None
        assert result.completed is True
        assert result.user_points == 10

    async def test_returns_not_completed_when_requirements_not_met(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="incomplete_seller",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        course, _, _ = await builder.build_course_with_materials(
            course_kwargs={"mrp": 100},
            material_count=2,
        )
        await builder.build_course_user(user=seller, course=course)
        request = CompleteCourseRequest(course_id=course.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = CompleteCourseUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is not None
        assert result.completed is False
        assert "Не выполнены требования" in result.message

    async def test_returns_none_for_not_enrolled_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="not_enrolled",
            first_name="Bob",
            role=UserRole.SELLER,
        )
        course = await builder.build_course()
        request = CompleteCourseRequest(course_id=course.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = CompleteCourseUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is None

    async def test_returns_none_for_non_seller_role(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.build_user(
            external_system_id="manager_try",
            first_name="Manager",
            role=UserRole.MANAGER,
        )
        course = await builder.build_course()
        request = CompleteCourseRequest(course_id=course.id)
        ctx = UserContext(user_id=manager.id, role=UserRole.MANAGER)
        usecase = CompleteCourseUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is None

    async def test_returns_already_completed_message(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="already_done",
            first_name="Done",
            role=UserRole.SELLER,
        )
        course = await builder.build_course()
        await builder.build_course_user(
            user=seller,
            course=course,
            is_course_completed=True,
        )
        request = CompleteCourseRequest(course_id=course.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = CompleteCourseUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is not None
        assert result.completed is False
        assert "уже завершён" in result.message
