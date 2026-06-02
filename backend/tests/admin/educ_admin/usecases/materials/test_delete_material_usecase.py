from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.materials.delete_material_usecase import DeleteMaterialUseCase
from app.knowledge_base.db_models import MaterialModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestDeleteMaterialUseCase:
    async def test_deletes_material_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        material = await builder.build_material(name="To Delete")

        result = await DeleteMaterialUseCase(db_session).execute(
            material.id,
            admin_ctx(education_admin),
        )

        assert result is True
        remaining = (
            await db_session.execute(
                select(MaterialModel).where(MaterialModel.id == material.id)
            )
        ).scalar_one_or_none()
        assert remaining is None

    async def test_returns_none_when_material_not_found(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await DeleteMaterialUseCase(db_session).execute(
            999999,
            admin_ctx(education_admin),
        )

        assert result is None
