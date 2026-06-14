from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.reset_course_progress_usecase import (
    ResetCourseProgressUseCase,
)
from app.knowledge_base.db_models import CourseUserModel, UserCourseMaterialModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestResetCourseProgressUseCase:
    async def test_resets_course_progress_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        seller = await builder.default_seller
        await builder.build_course_user(
            user=seller,
            course=course,
            user_points_by_course=80,
            is_course_completed=True,
        )
        await builder.build_user_course_material(
            user=seller,
            course=course,
            material=materials[0],
            is_completed=True,
        )

        result = await ResetCourseProgressUseCase(db_session).execute(
            course.id,
            seller.id,
            admin_ctx(education_admin),
        )

        assert result is True
        enrollment = (
            await db_session.execute(
                select(CourseUserModel).where(
                    CourseUserModel.course_id == course.id,
                    CourseUserModel.user_id == seller.id,
                )
            )
        ).scalar_one()
        assert enrollment.is_course_completed is False
        assert enrollment.user_points_by_course == 0
        material_progress = (
            await db_session.execute(
                select(UserCourseMaterialModel).where(
                    UserCourseMaterialModel.course_id == course.id,
                    UserCourseMaterialModel.user_id == seller.id,
                )
            )
        ).scalar_one_or_none()
        assert material_progress is None

    async def test_returns_none_when_enrollment_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        seller = await builder.default_seller

        result = await ResetCourseProgressUseCase(db_session).execute(
            course.id,
            seller.id,
            admin_ctx(education_admin),
        )

        assert result is None
