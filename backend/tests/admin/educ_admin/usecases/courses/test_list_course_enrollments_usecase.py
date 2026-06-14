from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.list_course_enrollments_usecase import (
    ListCourseEnrollmentsUseCase,
)
from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestListCourseEnrollmentsUseCase:
    async def test_returns_enrollments_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        seller = await builder.default_seller
        await builder.build_course_user(user=seller, course=course, user_points_by_course=25)

        result = await ListCourseEnrollmentsUseCase(db_session).execute(
            course.id,
            admin_ctx(education_admin),
        )

        assert result is not None
        assert len(result.items) == 1
        assert result.items[0].user_id == seller.id
        assert result.items[0].progress == 25.0

    async def test_returns_none_when_course_not_found(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await ListCourseEnrollmentsUseCase(db_session).execute(
            999999,
            admin_ctx(education_admin),
        )

        assert result is None

    async def test_returns_none_when_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        course = await builder.build_course()
        seller = await builder.default_seller

        result = await ListCourseEnrollmentsUseCase(db_session).execute(
            course.id,
            UserContext(user_id=seller.id, role=UserRole.SELLER),
        )

        assert result is None
