from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import AssignCourseEnrollmentRequest
from app.admin.educ_admin.usecases.courses.assign_course_to_user_usecase import (
    AssignCourseToUserUseCase,
)
from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestAssignCourseToUserUseCase:
    async def test_assigns_course_to_user_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course(name="Enrollment Course")
        seller = await builder.build_user(
            external_system_id="enroll_target",
            first_name="Anna",
            last_name="Seller",
            role=UserRole.SELLER,
        )

        result = await AssignCourseToUserUseCase(db_session).execute(
            course.id,
            AssignCourseEnrollmentRequest(user_id=seller.id),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.user_id == seller.id
        assert result.progress == 0.0
        assert result.is_completed is False
        assert "Seller" in result.name

    async def test_returns_existing_enrollment_when_already_assigned(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        seller = await builder.default_seller
        await builder.build_course_user(user=seller, course=course, user_points_by_course=50)

        result = await AssignCourseToUserUseCase(db_session).execute(
            course.id,
            AssignCourseEnrollmentRequest(user_id=seller.id),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.progress == 50.0

    async def test_returns_none_when_user_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()

        result = await AssignCourseToUserUseCase(db_session).execute(
            course.id,
            AssignCourseEnrollmentRequest(user_id=uuid4()),
            admin_ctx(education_admin),
        )

        assert result is None
