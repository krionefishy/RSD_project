from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_CONTENT_VIEW_ALL_ROLES
from app.knowledge_base.db_models import CourseUserModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import UserCourseDTO, UserCoursesListDTO
from app.users.db_models import UserRole


class ListUserCoursesUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        target_user_id: UUID,
        ctx: UserContext,
    ) -> Optional[UserCoursesListDTO]:
        if ctx.role in KB_CONTENT_VIEW_ALL_ROLES:
            pass
        elif ctx.role == UserRole.SELLER:
            if target_user_id != ctx.user_id:
                return None
        else:
            return None

        query = (
            select(CourseUserModel)
            .where(CourseUserModel.user_id == target_user_id)
            .options(selectinload(CourseUserModel.course))
        )

        result = await self.session.execute(query)
        user_courses = result.scalars().all()

        items = [
            UserCourseDTO(
                course_id=uc.course_id,
                course_name=uc.course.name if uc.course else "",
                user_points_by_course=uc.user_points_by_course,
                is_course_completed=uc.is_course_completed,
                is_course_completed_successfully=uc.is_course_completed_successfully,
                completion_percentage=round(uc.completion_percentage, 2),
            )
            for uc in user_courses
        ]

        return UserCoursesListDTO(
            items=items,
            user_id=str(target_user_id),
        )
