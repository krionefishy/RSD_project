from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import CreateCourseRequest
from app.admin.educ_admin.usecases.courses.create_course_usecase import CreateCourseUseCase
from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestCreateCourseUseCase:
    async def test_creates_course_when_education_admin(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await CreateCourseUseCase(db_session).execute(
            CreateCourseRequest(
                name="Usecase Course",
                description="Description",
                rating_points=50,
                mrp=40,
            ),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.name == "Usecase Course"
        assert result.materials_count == 0
        assert result.tests_count == 0

    async def test_returns_none_when_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller

        result = await CreateCourseUseCase(db_session).execute(
            CreateCourseRequest(name="Forbidden Course"),
            UserContext(user_id=seller.id, role=UserRole.SELLER),
        )

        assert result is None
