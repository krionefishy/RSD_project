from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import CreateMaterialRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import MaterialModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import MaterialDTO


class CreateMaterialUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        request: CreateMaterialRequest,
        ctx: UserContext,
    ) -> Optional[MaterialDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        material = MaterialModel(
            name=request.name.strip(),
            category=request.category.strip(),
            description=request.description,
            text=request.text,
        )
        self.session.add(material)
        await self.session.commit()
        await self.session.refresh(material)

        return MaterialDTO(
            id=material.id,
            name=material.name,
            category=material.category,
            description=material.description,
            text=material.text,
            attachments=[],
            course_id=0,
            created_at=material.created_at,
        )
