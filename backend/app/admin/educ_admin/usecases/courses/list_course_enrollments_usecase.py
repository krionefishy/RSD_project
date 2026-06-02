from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseModel, CourseUserModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseEnrollmentDTO, CourseEnrollmentsListDTO
from app.users.db_models import UserModel


def _user_display_name(user: UserModel) -> str:
    parts = [user.last_name, user.first_name, user.middle_name]
    name = " ".join(part for part in parts if part)
    return name or user.external_system_id


class ListCourseEnrollmentsUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        ctx: UserContext,
    ) -> Optional[CourseEnrollmentsListDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        course = (
            await self.session.execute(
                select(CourseModel).where(CourseModel.id == course_id)
            )
        ).scalar_one_or_none()
        if course is None:
            return None

        rows = await self.session.execute(
            select(CourseUserModel)
            .where(CourseUserModel.course_id == course_id)
            .options(selectinload(CourseUserModel.user), selectinload(CourseUserModel.course))
        )
        enrollments = rows.scalars().all()

        items = [
            CourseEnrollmentDTO(
                user_id=enrollment.user_id,
                name=_user_display_name(enrollment.user),
                progress=enrollment.completion_percentage,
                is_completed=enrollment.is_course_completed,
            )
            for enrollment in enrollments
            if enrollment.user is not None
        ]
        return CourseEnrollmentsListDTO(items=items)
