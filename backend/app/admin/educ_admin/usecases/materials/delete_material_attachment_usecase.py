from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import MaterialAttachmentModel
from app.knowledge_base.domain import UserContext
from storage.s3.client import S3Client


class DeleteMaterialAttachmentUseCase:
    def __init__(self, session: AsyncSession, s3_client: Optional[S3Client]):
        self.session = session
        self.s3_client = s3_client

    async def execute(
        self,
        material_id: int,
        attachment_id: int,
        ctx: UserContext,
    ) -> Optional[bool]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        attachment = (
            await self.session.execute(
                select(MaterialAttachmentModel).where(
                    MaterialAttachmentModel.id == attachment_id,
                    MaterialAttachmentModel.material_id == material_id,
                )
            )
        ).scalar_one_or_none()
        if attachment is None:
            return None

        if self.s3_client is not None:
            await self.s3_client.delete_object(attachment.s3_file_key)

        await self.session.delete(attachment)
        await self.session.commit()
        return True
