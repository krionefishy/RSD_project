from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.materials.delete_material_attachment_usecase import (
    DeleteMaterialAttachmentUseCase,
)
from app.knowledge_base.db_models import MaterialAttachmentModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder
from tests.mocks import MockS3Client


class TestDeleteMaterialAttachmentUseCase:
    async def test_deletes_attachment_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        material = await builder.build_material()
        attachment = await builder.build_material_attachment(material=material)
        mock_s3 = MockS3Client()
        mock_s3._uploads[attachment.s3_file_key] = b"stored"

        result = await DeleteMaterialAttachmentUseCase(db_session, mock_s3).execute(
            material.id,
            attachment.id,
            admin_ctx(education_admin),
        )

        assert result is True
        assert mock_s3.was_operation_performed("delete_object", attachment.s3_file_key)
        remaining = (
            await db_session.execute(
                select(MaterialAttachmentModel).where(MaterialAttachmentModel.id == attachment.id)
            )
        ).scalar_one_or_none()
        assert remaining is None

    async def test_returns_none_when_attachment_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        material = await builder.build_material()

        result = await DeleteMaterialAttachmentUseCase(db_session, MockS3Client()).execute(
            material.id,
            999999,
            admin_ctx(education_admin),
        )

        assert result is None
