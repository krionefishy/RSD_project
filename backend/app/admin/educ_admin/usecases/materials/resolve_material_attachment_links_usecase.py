import inspect

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import MaterialAttachmentModel, MaterialModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import MaterialAttachmentLinkDTO, MaterialAttachmentLinksDTO
from storage.s3.client import S3Client


class ResolveMaterialAttachmentLinksUseCase:
    def __init__(self, session: AsyncSession, s3_client: S3Client | None):
        self.session = session
        self.s3_client = s3_client

    async def execute(
        self,
        material_id: int,
        attachment_ids: list[int],
        ctx: UserContext,
    ) -> MaterialAttachmentLinksDTO | None:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None
        if self.s3_client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 storage is not configured",
            )

        material_exists = (
            await self.session.execute(select(MaterialModel.id).where(MaterialModel.id == material_id))
        ).scalar_one_or_none()
        if material_exists is None:
            return None

        query = select(MaterialAttachmentModel).where(MaterialAttachmentModel.material_id == material_id)
        if attachment_ids:
            query = query.where(MaterialAttachmentModel.id.in_(attachment_ids))

        attachments = (await self.session.execute(query)).scalars().all()
        links: list[MaterialAttachmentLinkDTO] = []
        for attachment in attachments:
            maybe_url = self.s3_client.generate_presigned_url(attachment.s3_file_key)
            url = await maybe_url if inspect.isawaitable(maybe_url) else maybe_url
            links.append(MaterialAttachmentLinkDTO(attachment_id=attachment.id, url=url))
        return MaterialAttachmentLinksDTO(items=links)
