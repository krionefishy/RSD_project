from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseModel, CourseTestModel, TestModel, TestTaskAssignmentModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseTestTaskBankDTO, CourseTestTaskBankItemDTO


class ListCourseTestTaskBankUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        ctx: UserContext,
    ) -> Optional[CourseTestTaskBankDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        course = (
            await self.session.execute(select(CourseModel.id).where(CourseModel.id == course_id))
        ).scalar_one_or_none()
        if course is None:
            return None

        result = await self.session.execute(
            select(CourseTestModel)
            .where(CourseTestModel.course_id == course_id)
            .options(
                selectinload(CourseTestModel.test)
                .selectinload(TestModel.task_assignments)
                .selectinload(TestTaskAssignmentModel.task)
            )
        )
        course_tests = result.scalars().unique().all()

        items: list[CourseTestTaskBankItemDTO] = []
        seen_task_ids: set[int] = set()

        for course_test in course_tests:
            test = course_test.test
            if test is None:
                continue
            for assignment in test.task_assignments or []:
                task = assignment.task
                if task is None or task.id in seen_task_ids:
                    continue
                seen_task_ids.add(task.id)
                items.append(
                    CourseTestTaskBankItemDTO(
                        task_id=task.id,
                        test_id=test.id,
                        test_name=test.name,
                        task_name=task.name,
                        task_description=task.description,
                        points=task.points,
                        answer_variants_count=len(task.answer_variants or []),
                    )
                )

        items.sort(key=lambda item: (item.test_name.lower(), item.task_name.lower(), item.task_id))
        return CourseTestTaskBankDTO(items=items)
