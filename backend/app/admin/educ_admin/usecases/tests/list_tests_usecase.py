from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import TestModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestDTO, TestsListDTO


class ListTestsUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, ctx: UserContext) -> Optional[TestsListDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        result = await self.session.execute(
            select(TestModel)
            .options(
                selectinload(TestModel.task_assignments),
                selectinload(TestModel.course_tests),
            )
            .order_by(TestModel.name)
        )
        tests = result.scalars().unique().all()

        items = []
        for test in tests:
            course_id = test.course_tests[0].course_id if test.course_tests else 0
            items.append(
                TestDTO(
                    id=test.id,
                    name=test.name,
                    category=test.category,
                    description=test.description,
                    is_final=test.is_final,
                    pass_score_percent=test.pass_score_percent,
                    tasks_count=test.tasks_count,
                    total_points=test.total_points,
                    course_id=course_id,
                    created_at=test.created_at,
                )
            )
        return TestsListDTO(items=items)
