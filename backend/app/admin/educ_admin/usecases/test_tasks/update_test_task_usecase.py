from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import UpdateTestTaskRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import TestTaskModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestTaskAdminDTO


class UpdateTestTaskUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        task_id: int,
        request: UpdateTestTaskRequest,
        ctx: UserContext,
    ) -> Optional[TestTaskAdminDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        task = (
            await self.session.execute(select(TestTaskModel).where(TestTaskModel.id == task_id))
        ).scalar_one_or_none()
        if task is None:
            return None

        if request.name is not None:
            task.name = request.name.strip()
        if request.description is not None:
            task.description = request.description
        if request.points is not None:
            task.points = request.points
        if request.answer_variants is not None:
            cleaned = [variant.strip() for variant in request.answer_variants if variant.strip()]
            if len(cleaned) < 2:
                return None
            task.answer_variants = cleaned
        if request.correct_variant is not None:
            if request.correct_variant >= len(task.answer_variants):
                return None
            task.correct_variant = request.correct_variant

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
