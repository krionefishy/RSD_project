from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import UpdateCourseRequest
from app.admin.educ_admin.usecases.courses.update_course_usecase import UpdateCourseUseCase
from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestUpdateCourseUseCase:
    async def test_updates_course_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course(name="Old Name")

        result = await UpdateCourseUseCase(db_session).execute(
            course.id,
            UpdateCourseRequest(name="New Name", rating_points=99),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.name == "New Name"
        assert result.id == course.id

    async def test_returns_none_when_course_not_found(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await UpdateCourseUseCase(db_session).execute(
            999999,
            UpdateCourseRequest(name="Missing"),
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

        result = await UpdateCourseUseCase(db_session).execute(
            course.id,
            UpdateCourseRequest(name="Blocked"),
            UserContext(user_id=seller.id, role=UserRole.SELLER),
        )

        assert result is None
