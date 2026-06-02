from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseModel
from app.knowledge_base.domain import UserContext


class DeleteCourseUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, course_id: int, ctx: UserContext) -> Optional[bool]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        course = (
            await self.session.execute(select(CourseModel).where(CourseModel.id == course_id))
        ).scalar_one_or_none()
        if course is None:
            return None

        await self.session.delete(course)
        await self.session.commit()
        return True
