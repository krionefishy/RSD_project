from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import UserContext
from app.knowledge_base.usecases.user_courses.list_user_courses_usecase import ListUserCoursesUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestListUserCoursesUseCase:
    async def test_returns_courses_for_admin_viewing_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.build_user(
            external_system_id="admin_courses",
            first_name="Admin",
            role=UserRole.ADMIN_EDUCATION,
        )
        seller = await builder.build_user(
            external_system_id="seller_courses",
            first_name="Seller",
            role=UserRole.SELLER,
        )
        course1 = await builder.build_course(name="Course 1")
        course2 = await builder.build_course(name="Course 2")
        await builder.build_course_user(user=seller, course=course1)
        await builder.build_course_user(user=seller, course=course2)
        ctx = UserContext(user_id=admin.id, role=UserRole.ADMIN_EDUCATION)
        usecase = ListUserCoursesUseCase(db_session)

        result = await usecase.execute(seller.id, ctx)

        assert result is not None
        assert result.user_id == str(seller.id)
        assert len(result.items) == 2

    async def test_returns_own_courses_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="own_courses",
            first_name="John",
            role=UserRole.SELLER,
        )
        course = await builder.build_course(name="My Course")
        await builder.build_course_user(
            user=seller,
            course=course,
            user_points_by_course=50,
            is_course_completed=True,
        )
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = ListUserCoursesUseCase(db_session)

        result = await usecase.execute(seller.id, ctx)

        assert result is not None
        assert len(result.items) == 1
        assert result.items[0].course_name == "My Course"
        assert result.items[0].user_points_by_course == 50
        assert result.items[0].is_course_completed is True

    async def test_returns_none_when_seller_views_other_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller1 = await builder.build_user(
            external_system_id="seller_one",
            first_name="One",
            role=UserRole.SELLER,
        )
        seller2 = await builder.build_user(
            external_system_id="seller_two",
            first_name="Two",
            role=UserRole.SELLER,
        )
        ctx = UserContext(user_id=seller1.id, role=UserRole.SELLER)
        usecase = ListUserCoursesUseCase(db_session)

        result = await usecase.execute(seller2.id, ctx)

        assert result is None

    async def test_returns_none_for_unauthorized_role(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        sales_admin = await builder.build_user(
            external_system_id="sales_courses",
            first_name="Sales Admin",
            role=UserRole.ADMIN_SALES,
        )
        seller = await builder.build_user(
            external_system_id="target_seller",
            first_name="Target",
            role=UserRole.SELLER,
        )
        ctx = UserContext(user_id=sales_admin.id, role=UserRole.ADMIN_SALES)
        usecase = ListUserCoursesUseCase(db_session)

        result = await usecase.execute(seller.id, ctx)

        assert result is None

    async def test_returns_empty_list_when_no_courses(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="no_courses",
            first_name="Empty",
            role=UserRole.SELLER,
        )
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = ListUserCoursesUseCase(db_session)

        result = await usecase.execute(seller.id, ctx)

        assert result is not None
        assert len(result.items) == 0
