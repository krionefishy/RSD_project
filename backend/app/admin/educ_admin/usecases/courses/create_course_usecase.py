from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import CreateCourseRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseListItemDTO


class CreateCourseUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        request: CreateCourseRequest,
        ctx: UserContext,
    ) -> Optional[CourseListItemDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        course = CourseModel(
            name=request.name.strip(),
            description=request.description,
            rating_points=request.rating_points,
            mrp=request.mrp,
        )
        self.session.add(course)
        await self.session.commit()
        await self.session.refresh(course)

        return CourseListItemDTO(
            id=course.id,
            name=course.name,
            description=course.description,
            materials_count=0,
            tests_count=0,
        )
