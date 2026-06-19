from sqlalchemy import select
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.reset_test_progress_usecase import (
    ResetTestProgressUseCase,
)
from app.knowledge_base.db_models import CourseUserModel, UserCourseTestModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestResetTestProgressUseCase:
    async def test_resets_test_progress_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course, test, _, _ = await builder.build_course_with_test()
        seller = await builder.default_seller
        await builder.build_course_user(user=seller, course=course)
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test,
            is_passed=True,
            score=100,
        )

        result = await ResetTestProgressUseCase(db_session).execute(
            course.id,
            seller.id,
            test.id,
            admin_ctx(education_admin),
        )

        assert result is True
        progress = (
            await db_session.execute(
                select(UserCourseTestModel).where(
                    UserCourseTestModel.course_id == course.id,
                    UserCourseTestModel.user_id == seller.id,
                    UserCourseTestModel.test_id == test.id,
                )
            )
        ).scalar_one_or_none()
        assert progress is None

    async def test_recalculates_course_points_after_reset(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course, test_a, _, _ = await builder.build_course_with_test()
        test_b = await builder.build_test()
        await builder.build_course_test(course=course, test=test_b)
        seller = await builder.default_seller
        await builder.build_course_user(
            user=seller,
            course=course,
            user_points_by_course=15,
            is_course_completed=True,
            is_course_completed_successfully=True,
        )
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test_a,
            is_passed=False,
            score=5,
        )
        await builder.build_user_course_test(
            user=seller,
            course=course,
            test=test_b,
            is_passed=True,
            score=10,
        )
        await db_session.execute(
            update(UserCourseTestModel)
            .where(
                UserCourseTestModel.course_id == course.id,
                UserCourseTestModel.user_id == seller.id,
            )
            .values(completed_at=builder._default_datetime)
        )
        await db_session.commit()

        result = await ResetTestProgressUseCase(db_session).execute(
            course.id,
            seller.id,
            test_a.id,
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
        assert enrollment.user_points_by_course == 10
        assert enrollment.is_course_completed is False
        assert enrollment.is_course_completed_successfully is False

    async def test_returns_none_when_test_not_in_course(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        test = await builder.build_test()
        seller = await builder.default_seller
        await builder.build_course_user(user=seller, course=course)

        result = await ResetTestProgressUseCase(db_session).execute(
            course.id,
            seller.id,
            test.id,
            admin_ctx(education_admin),
        )

        assert result is None
