from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.reset_test_progress_usecase import (
    ResetTestProgressUseCase,
)
from app.knowledge_base.db_models import UserCourseTestModel
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
