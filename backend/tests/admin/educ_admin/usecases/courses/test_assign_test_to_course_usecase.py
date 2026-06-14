from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import AssignTestToCourseRequest
from app.admin.educ_admin.usecases.courses.assign_test_to_course_usecase import (
    AssignTestToCourseUseCase,
)
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestAssignTestToCourseUseCase:
    async def test_assigns_test_to_course_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        test = await builder.build_test(name="Final Quiz", is_final=True)

        result = await AssignTestToCourseUseCase(db_session).execute(
            course.id,
            AssignTestToCourseRequest(test_id=test.id, is_final=True),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.test_id == test.id
        assert result.is_final is True

    async def test_returns_existing_link_when_already_assigned(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course, test, _, _ = await builder.build_course_with_test(is_final=True)

        result = await AssignTestToCourseUseCase(db_session).execute(
            course.id,
            AssignTestToCourseRequest(test_id=test.id, is_final=True),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.test_id == test.id

    async def test_returns_none_when_test_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()

        result = await AssignTestToCourseUseCase(db_session).execute(
            course.id,
            AssignTestToCourseRequest(test_id=999999),
            admin_ctx(education_admin),
        )

        assert result is None
