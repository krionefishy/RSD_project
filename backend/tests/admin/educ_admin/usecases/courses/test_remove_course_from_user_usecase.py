from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.remove_course_from_user_usecase import (
    RemoveCourseFromUserUseCase,
)
from app.knowledge_base.db_models import CourseUserModel
from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestRemoveCourseFromUserUseCase:
    async def test_removes_enrollment_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        seller = await builder.default_seller
        await builder.build_course_user(user=seller, course=course)

        result = await RemoveCourseFromUserUseCase(db_session).execute(
            course.id,
            seller.id,
            admin_ctx(education_admin),
        )

        assert result is True
        remaining = (
            await db_session.execute(
                select(CourseUserModel).where(
                    CourseUserModel.course_id == course.id,
                    CourseUserModel.user_id == seller.id,
                )
            )
        ).scalar_one_or_none()
        assert remaining is None

    async def test_returns_none_when_enrollment_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        seller = await builder.default_seller

        result = await RemoveCourseFromUserUseCase(db_session).execute(
            course.id,
            seller.id,
            admin_ctx(education_admin),
        )

        assert result is None
