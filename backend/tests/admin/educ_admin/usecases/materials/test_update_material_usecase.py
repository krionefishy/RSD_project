from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import UpdateMaterialRequest
from app.admin.educ_admin.usecases.materials.update_material_usecase import UpdateMaterialUseCase
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestUpdateMaterialUseCase:
    async def test_updates_material_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        material = await builder.build_material(name="Old Material")

        result = await UpdateMaterialUseCase(db_session).execute(
            material.id,
            UpdateMaterialRequest(name="Updated Material", text="New text"),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.name == "Updated Material"
        assert result.text == "New text"

    async def test_returns_none_when_material_not_found(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await UpdateMaterialUseCase(db_session).execute(
            999999,
            UpdateMaterialRequest(name="Missing"),
            admin_ctx(education_admin),
        )

        assert result is None

    async def test_allows_switching_material_text_to_empty(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        material = await builder.build_material(text="Legacy text")

        result = await UpdateMaterialUseCase(db_session).execute(
            material.id,
            UpdateMaterialRequest(text=""),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.text == ""
