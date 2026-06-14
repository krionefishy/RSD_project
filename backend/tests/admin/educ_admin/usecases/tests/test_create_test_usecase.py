from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import CreateTestRequest
from app.admin.educ_admin.usecases.tests.create_test_usecase import CreateTestUseCase
from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestCreateTestUseCase:
    async def test_creates_test_when_education_admin(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await CreateTestUseCase(db_session).execute(
            CreateTestRequest(
                name="Safety Quiz",
                category="compliance",
                is_final=True,
                pass_score_percent=80,
            ),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.name == "Safety Quiz"
        assert result.is_final is True
        assert result.pass_score_percent == 80
        assert result.tasks_count == 0

    async def test_returns_none_when_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller

        result = await CreateTestUseCase(db_session).execute(
            CreateTestRequest(name="Blocked", category="x"),
            UserContext(user_id=seller.id, role=UserRole.SELLER),
        )

        assert result is None
