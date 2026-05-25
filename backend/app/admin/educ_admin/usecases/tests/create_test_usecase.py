from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import CreateTestRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import TestModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestDTO


class CreateTestUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        request: CreateTestRequest,
        ctx: UserContext,
    ) -> Optional[TestDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        test = TestModel(
            name=request.name.strip(),
            category=request.category.strip(),
            description=request.description,
            is_final=request.is_final,
            pass_score_percent=request.pass_score_percent,
        )
        self.session.add(test)
        await self.session.commit()
        await self.session.refresh(test)

        return TestDTO(
            id=test.id,
            name=test.name,
            category=test.category,
            description=test.description,
            is_final=test.is_final,
            pass_score_percent=test.pass_score_percent,
            tasks_count=0,
            total_points=0,
            course_id=0,
            created_at=test.created_at,
        )
