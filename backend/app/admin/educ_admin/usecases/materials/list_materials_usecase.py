from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import MaterialModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import MaterialAttachmentDTO, MaterialDTO, MaterialsListDTO


class ListMaterialsUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, ctx: UserContext) -> Optional[MaterialsListDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        result = await self.session.execute(
            select(MaterialModel)
            .options(
                selectinload(MaterialModel.attachments),
                selectinload(MaterialModel.course_materials),
            )
            .order_by(MaterialModel.name)
        )
        materials = result.scalars().unique().all()

        items = []
        for material in materials:
            course_id = (
                material.course_materials[0].course_id if material.course_materials else 0
            )
            items.append(
                MaterialDTO(
                    id=material.id,
                    name=material.name,
                    category=material.category,
                    description=material.description,
                    text=material.text,
                    attachments=[
                        MaterialAttachmentDTO(
                            id=attachment.id,
                            name=attachment.name,
                            format=attachment.format,
                        )
                        for attachment in material.attachments
                    ],
                    course_id=course_id,
                    created_at=material.created_at,
                )
            )
        return MaterialsListDTO(items=items)
