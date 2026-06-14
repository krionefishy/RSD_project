import inspect

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_CONTENT_VIEW_ALL_ROLES
from app.knowledge_base.db_models import CourseMaterialModel, CourseUserModel, MaterialAttachmentModel
from app.knowledge_base.domain import ResolveMaterialAttachmentsRequest, UserContext
from app.knowledge_base.dto import MaterialAttachmentLinkDTO, MaterialAttachmentLinksDTO
from app.users.db_models import UserRole
from storage.s3.client import S3Client


class ResolveMaterialAttachmentsUseCase:
    def __init__(self, session: AsyncSession, s3_client: S3Client | None):
        self.session = session
        self.s3_client = s3_client

    async def execute(
        self,
        material_id: int,
        request: ResolveMaterialAttachmentsRequest,
        ctx: UserContext,
    ) -> MaterialAttachmentLinksDTO | None:
        if ctx.role.value not in KB_CONTENT_VIEW_ALL_ROLES and ctx.role != UserRole.SELLER:
            return None
        if self.s3_client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 storage is not configured",
            )

        access_query = (
            select(CourseMaterialModel.id)
            .where(
                CourseMaterialModel.course_id == request.course_id,
                CourseMaterialModel.material_id == material_id,
            )
        )
        if ctx.role == UserRole.SELLER:
            access_query = access_query.join(
                CourseUserModel,
                CourseUserModel.course_id == CourseMaterialModel.course_id,
            ).where(CourseUserModel.user_id == ctx.user_id)

        access = (await self.session.execute(access_query)).scalar_one_or_none()
        if access is None:
            return None

        attachments_query = select(MaterialAttachmentModel).where(
            MaterialAttachmentModel.material_id == material_id,
        )
        if request.attachment_ids:
            attachments_query = attachments_query.where(MaterialAttachmentModel.id.in_(request.attachment_ids))

        attachments = (await self.session.execute(attachments_query)).scalars().all()
        links: list[MaterialAttachmentLinkDTO] = []
        for attachment in attachments:
            maybe_url = self.s3_client.generate_presigned_url(attachment.s3_file_key)
            url = await maybe_url if inspect.isawaitable(maybe_url) else maybe_url
            links.append(MaterialAttachmentLinkDTO(attachment_id=attachment.id, url=url))

        return MaterialAttachmentLinksDTO(items=links)
