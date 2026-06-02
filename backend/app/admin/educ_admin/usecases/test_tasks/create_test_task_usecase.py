from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import CreateTestTaskRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import TestTaskModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestTaskAdminDTO


class CreateTestTaskUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        request: CreateTestTaskRequest,
        ctx: UserContext,
    ) -> Optional[TestTaskAdminDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        task = TestTaskModel(
            name=request.name.strip(),
            description=request.description,
            points=request.points,
            answer_variants=request.answer_variants,
            correct_variant=request.correct_variant,
        )
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)

        return TestTaskAdminDTO(
            id=task.id,
            name=task.name,
            description=task.description,
            points=task.points,
            answer_variants=task.answer_variants,
            correct_variant=task.correct_variant,
        )
