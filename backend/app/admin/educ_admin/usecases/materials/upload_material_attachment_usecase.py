from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import MaterialAttachmentModel, MaterialModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import MaterialAttachmentDTO
from storage.s3.client import S3Client


class UploadMaterialAttachmentUseCase:
    def __init__(self, session: AsyncSession, s3_client: Optional[S3Client]):
        self.session = session
        self.s3_client = s3_client

    async def execute(
        self,
        material_id: int,
        filename: str,
        content_type: str,
        payload: bytes,
        ctx: UserContext,
    ) -> Optional[MaterialAttachmentDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None
        if self.s3_client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 storage is not configured",
            )

        material = (
            await self.session.execute(select(MaterialModel).where(MaterialModel.id == material_id))
        ).scalar_one_or_none()
        if material is None:
            return None

        safe_name = self.s3_client.sanitize_key_segment(filename, "attachment")
        extension = safe_name.rsplit(".", 1)[-1].lower() if "." in safe_name else "bin"
        display_name = safe_name.rsplit(".", 1)[0] if "." in safe_name else safe_name
        s3_key = MaterialAttachmentModel.generate_s3_key(material_id, display_name, extension)

        await self.s3_client.put_object(
            key=s3_key,
            body=payload,
            content_type=content_type,
            metadata={"material_id": str(material_id)},
        )

        attachment = MaterialAttachmentModel(
            material_id=material_id,
            name=display_name,
            format=extension,
            s3_file_key=s3_key,
        )
        self.session.add(attachment)
        await self.session.commit()
        await self.session.refresh(attachment)

        return MaterialAttachmentDTO(
            id=attachment.id,
            name=attachment.name,
            format=attachment.format,
        )
