from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin.educ_admin.domain import UpdateCourseRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseListItemDTO


class UpdateCourseUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        request: UpdateCourseRequest,
        ctx: UserContext,
    ) -> Optional[CourseListItemDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        course = (
            await self.session.execute(
                select(CourseModel)
                .where(CourseModel.id == course_id)
                .options(
                    selectinload(CourseModel.course_materials),
                    selectinload(CourseModel.course_tests),
                )
            )
        ).scalar_one_or_none()
        if course is None:
            return None

        if request.name is not None:
            course.name = request.name.strip()
        if request.description is not None:
            course.description = request.description
        if request.rating_points is not None:
            course.rating_points = request.rating_points
        if request.mrp is not None:
            course.mrp = request.mrp

        materials_count = course.materials_count
        tests_count = course.tests_count
        await self.session.commit()
        await self.session.refresh(course)

        return CourseListItemDTO(
            id=course.id,
            name=course.name,
            description=course.description,
            materials_count=materials_count,
            tests_count=tests_count,
        )
