from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.remove_test_from_course_usecase import (
    RemoveTestFromCourseUseCase,
)
from app.knowledge_base.db_models import CourseTestModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestRemoveTestFromCourseUseCase:
    async def test_removes_test_from_course_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course, test, _, _ = await builder.build_course_with_test()

        result = await RemoveTestFromCourseUseCase(db_session).execute(
            course.id,
            test.id,
            admin_ctx(education_admin),
        )

        assert result is True
        remaining = (
            await db_session.execute(
                select(CourseTestModel).where(
                    CourseTestModel.course_id == course.id,
                    CourseTestModel.test_id == test.id,
                )
            )
        ).scalar_one_or_none()
        assert remaining is None

    async def test_returns_none_when_assignment_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        test = await builder.build_test()

        result = await RemoveTestFromCourseUseCase(db_session).execute(
            course.id,
            test.id,
            admin_ctx(education_admin),
        )

        assert result is None
