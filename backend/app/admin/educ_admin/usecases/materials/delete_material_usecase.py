from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import MaterialModel
from app.knowledge_base.domain import UserContext


class DeleteMaterialUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, material_id: int, ctx: UserContext) -> Optional[bool]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        material = (
            await self.session.execute(select(MaterialModel).where(MaterialModel.id == material_id))
        ).scalar_one_or_none()
        if material is None:
            return None

        await self.session.delete(material)
        await self.session.commit()
        return True
