from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import CreateMaterialRequest
from app.admin.educ_admin.usecases.materials.create_material_usecase import CreateMaterialUseCase
from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestCreateMaterialUseCase:
    async def test_creates_material_when_education_admin(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await CreateMaterialUseCase(db_session).execute(
            CreateMaterialRequest(
                name="New Material",
                category="sales",
                description="Desc",
                text="Content body",
            ),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.name == "New Material"
        assert result.category == "sales"
        assert result.attachments == []

    async def test_returns_none_when_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller

        result = await CreateMaterialUseCase(db_session).execute(
            CreateMaterialRequest(
                name="Blocked",
                category="sales",
                text="text",
            ),
            UserContext(user_id=seller.id, role=UserRole.SELLER),
        )

        assert result is None
