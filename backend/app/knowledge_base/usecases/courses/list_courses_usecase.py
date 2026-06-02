from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_CONTENT_VIEW_ALL_ROLES
from app.knowledge_base.db_models import CourseModel, CourseUserModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseListItemDTO, CoursesListDTO
from app.users.db_models import UserRole


class ListCoursesUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        ctx: UserContext,
    ) -> Optional[CoursesListDTO]:
        if ctx.role.value not in KB_CONTENT_VIEW_ALL_ROLES and ctx.role != UserRole.SELLER:
            return None

        query = select(CourseModel)

        if ctx.role == UserRole.SELLER:
            query = query.join(
                CourseUserModel,
                CourseUserModel.course_id == CourseModel.id,
            ).where(CourseUserModel.user_id == ctx.user_id)

        query = query.options(
            selectinload(CourseModel.course_materials),
            selectinload(CourseModel.course_tests),
        )

        result = await self.session.execute(query)
        courses = result.scalars().unique().all()

        items = [
            CourseListItemDTO(
                id=course.id,
                name=course.name,
                description=course.description,
                materials_count=course.materials_count,
                tests_count=course.tests_count,
            )
            for course in courses
        ]

        return CoursesListDTO(items=items)
