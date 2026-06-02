from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.materials.upload_material_attachment_usecase import (
    UploadMaterialAttachmentUseCase,
)
from app.knowledge_base.db_models import MaterialAttachmentModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder
from tests.mocks import MockS3Client


class TestUploadMaterialAttachmentUseCase:
    async def test_uploads_attachment_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        material = await builder.build_material()
        mock_s3 = MockS3Client()

        result = await UploadMaterialAttachmentUseCase(db_session, mock_s3).execute(
            material.id,
            filename="guide.pdf",
            content_type="application/pdf",
            payload=b"pdf-content",
            ctx=admin_ctx(education_admin),
        )

        assert result is not None
        assert result.name == "guide"
        assert result.format == "pdf"
        assert mock_s3.was_operation_performed("put_object")
        attachment = (
            await db_session.execute(
                select(MaterialAttachmentModel).where(MaterialAttachmentModel.id == result.id)
            )
        ).scalar_one()
        assert attachment.material_id == material.id

    async def test_returns_none_when_material_not_found(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await UploadMaterialAttachmentUseCase(db_session, MockS3Client()).execute(
            999999,
            filename="file.pdf",
            content_type="application/pdf",
            payload=b"x",
            ctx=admin_ctx(education_admin),
        )

        assert result is None

    async def test_raises_when_s3_not_configured(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        material = await builder.build_material()

        with pytest.raises(HTTPException) as exc_info:
            await UploadMaterialAttachmentUseCase(db_session, None).execute(
                material.id,
                filename="file.pdf",
                content_type="application/pdf",
                payload=b"x",
                ctx=admin_ctx(education_admin),
            )

        assert exc_info.value.status_code == 503
