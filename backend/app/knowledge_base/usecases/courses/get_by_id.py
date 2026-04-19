from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.db_models import CourseModel, CourseUserModel
from app.knowledge_base.dto import CourseDTO


class GetCourseByIdUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        user_id: str,
        role: str,
    ) -> Optional[CourseDTO]:
        is_admin = role == "admin"

        if not is_admin:
            has_access = await self._check_user_access(
                user_id=user_id,
                course_id=course_id,
            )
            if not has_access:
                return None

        query = (
            select(CourseModel)
            .where(CourseModel.id == course_id)
            .options(
                selectinload(CourseModel.course_materials),
                selectinload(CourseModel.course_tests),
            )
        )
        result = await self.session.execute(query)
        course = result.scalar_one_or_none()

        if course is None:
            return None

        return CourseDTO(
            id=course.id,
            name=course.name,
            description=course.description,
            rating_points=course.rating_points,
            mrp=course.mrp,
            materials_count=course.materials_count,
            tests_count=course.tests_count,
            created_at=course.created_at,
        )

    async def _check_user_access(
        self,
        user_id: str,
        course_id: int,
    ) -> bool:
        query = (
            select(CourseUserModel)
            .where(
                CourseUserModel.user_id == user_id,
                CourseUserModel.course_id == course_id,
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none() is not None
