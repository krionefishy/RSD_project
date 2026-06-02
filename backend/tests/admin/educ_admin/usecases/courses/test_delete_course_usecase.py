from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.delete_course_usecase import DeleteCourseUseCase
from app.knowledge_base.db_models import CourseModel
from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestDeleteCourseUseCase:
    async def test_deletes_course_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course(name="To Delete")

        result = await DeleteCourseUseCase(db_session).execute(
            course.id,
            admin_ctx(education_admin),
        )

        assert result is True
        remaining = (
            await db_session.execute(select(CourseModel).where(CourseModel.id == course.id))
        ).scalar_one_or_none()
        assert remaining is None

    async def test_returns_none_when_course_not_found(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await DeleteCourseUseCase(db_session).execute(
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

        result = await DeleteCourseUseCase(db_session).execute(
            course.id,
            UserContext(user_id=seller.id, role=UserRole.SELLER),
        )

        assert result is None
