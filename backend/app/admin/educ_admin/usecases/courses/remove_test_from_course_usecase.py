from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseTestModel
from app.knowledge_base.domain import UserContext


class RemoveTestFromCourseUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        test_id: int,
        ctx: UserContext,
    ) -> Optional[bool]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        link = (
            await self.session.execute(
                select(CourseTestModel).where(
                    CourseTestModel.course_id == course_id,
                    CourseTestModel.test_id == test_id,
                )
            )
        ).scalar_one_or_none()
        if link is None:
            return None

        await self.session.delete(link)
        await self.session.commit()
        return True
