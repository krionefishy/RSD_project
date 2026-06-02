from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.materials.list_materials_usecase import ListMaterialsUseCase
from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestListMaterialsUseCase:
    async def test_returns_materials_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        await builder.build_material(name="Material A")
        await builder.build_material(name="Material B")

        result = await ListMaterialsUseCase(db_session).execute(admin_ctx(education_admin))

        assert result is not None
        assert len(result.items) == 2
        assert {item.name for item in result.items} == {"Material A", "Material B"}

    async def test_returns_none_when_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller

        result = await ListMaterialsUseCase(db_session).execute(
            UserContext(user_id=seller.id, role=UserRole.SELLER),
        )

        assert result is None
