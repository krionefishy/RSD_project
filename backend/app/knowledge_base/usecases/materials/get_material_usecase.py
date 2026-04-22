from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_CONTENT_VIEW_ALL_ROLES
from app.knowledge_base.db_models import (
    CourseMaterialModel,
    CourseUserModel,
    MaterialModel,
)
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import MaterialAttachmentDTO, MaterialDTO
from app.users.db_models import UserRole


class GetMaterialByIdUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        material_id: int,
        course_id: int,
        ctx: UserContext,
    ) -> Optional[MaterialDTO]:
        if ctx.role.value not in KB_CONTENT_VIEW_ALL_ROLES and ctx.role != UserRole.SELLER:
            return None

        query = (
            select(MaterialModel)
            .join(
                CourseMaterialModel,
                CourseMaterialModel.material_id == MaterialModel.id,
            )
            .where(
                CourseMaterialModel.course_id == course_id,
                CourseMaterialModel.material_id == material_id,
            )
            .options(selectinload(MaterialModel.attachments))
        )

        if ctx.role == UserRole.SELLER:
            query = query.join(
                CourseUserModel,
                CourseUserModel.course_id == CourseMaterialModel.course_id,
            ).where(CourseUserModel.user_id == ctx.user_id)

        material_result = await self.session.execute(query)
        material = material_result.scalar_one_or_none()
        if material is None:
            return None

        attachments = [
            MaterialAttachmentDTO(
                id=att.id,
                name=att.name,
                format=att.format,
            )
            for att in (material.attachments or [])
        ]

        return MaterialDTO(
            id=material.id,
            name=material.name,
            category=material.category,
            description=material.description,
            text=material.text,
            attachments=attachments,
            course_id=course_id,
            created_at=material.created_at,
        )
