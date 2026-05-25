from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin.educ_admin.domain import UpdateTestRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import TestModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestDTO


class UpdateTestUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        test_id: int,
        request: UpdateTestRequest,
        ctx: UserContext,
    ) -> Optional[TestDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        test = (
            await self.session.execute(
                select(TestModel)
                .where(TestModel.id == test_id)
                .options(
                    selectinload(TestModel.task_assignments),
                    selectinload(TestModel.course_tests),
                )
            )
        ).scalar_one_or_none()
        if test is None:
            return None

        if request.name is not None:
            test.name = request.name.strip()
        if request.category is not None:
            test.category = request.category.strip()
        if request.description is not None:
            test.description = request.description
        if request.is_final is not None:
            test.is_final = request.is_final
        if request.pass_score_percent is not None:
            test.pass_score_percent = request.pass_score_percent

        course_id = test.course_tests[0].course_id if test.course_tests else 0
        tasks_count = test.tasks_count
        total_points = test.total_points
        await self.session.commit()
        await self.session.refresh(test)

        return TestDTO(
            id=test.id,
            name=test.name,
            category=test.category,
            description=test.description,
            is_final=test.is_final,
            pass_score_percent=test.pass_score_percent,
            tasks_count=tasks_count,
            total_points=total_points,
            course_id=course_id,
            created_at=test.created_at,
        )
