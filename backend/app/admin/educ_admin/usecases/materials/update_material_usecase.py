from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin.educ_admin.domain import UpdateMaterialRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import MaterialModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import MaterialAttachmentDTO, MaterialDTO


class UpdateMaterialUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        material_id: int,
        request: UpdateMaterialRequest,
        ctx: UserContext,
    ) -> Optional[MaterialDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        material = (
            await self.session.execute(
                select(MaterialModel)
                .where(MaterialModel.id == material_id)
                .options(
                    selectinload(MaterialModel.attachments),
                    selectinload(MaterialModel.course_materials),
                )
            )
        ).scalar_one_or_none()
        if material is None:
            return None

        if request.name is not None:
            material.name = request.name.strip()
        if request.category is not None:
            material.category = request.category.strip()
        if request.description is not None:
            material.description = request.description
        if request.text is not None:
            material.text = request.text

        attachments = [
            MaterialAttachmentDTO(
                id=attachment.id,
                name=attachment.name,
                format=attachment.format,
            )
            for attachment in material.attachments
        ]
        course_id = material.course_materials[0].course_id if material.course_materials else 0
        await self.session.commit()
        await self.session.refresh(material)

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
