from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin.educ_admin.domain import AssignCourseEnrollmentRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseModel, CourseUserModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseEnrollmentDTO
from app.users.db_models import UserModel


def _user_display_name(user: UserModel) -> str:
    parts = [user.last_name, user.first_name, user.middle_name]
    name = " ".join(part for part in parts if part)
    return name or user.external_system_id


class AssignCourseToUserUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        request: AssignCourseEnrollmentRequest,
        ctx: UserContext,
    ) -> Optional[CourseEnrollmentDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        course = (
            await self.session.execute(select(CourseModel).where(CourseModel.id == course_id))
        ).scalar_one_or_none()
        user = (
            await self.session.execute(select(UserModel).where(UserModel.id == request.user_id))
        ).scalar_one_or_none()
        if course is None or user is None:
            return None

        existing = (
            await self.session.execute(
                select(CourseUserModel)
                .where(
                    CourseUserModel.course_id == course_id,
                    CourseUserModel.user_id == request.user_id,
                )
                .options(selectinload(CourseUserModel.course))
            )
        ).scalar_one_or_none()
        if existing is not None:
            return CourseEnrollmentDTO(
                user_id=existing.user_id,
                name=_user_display_name(user),
                progress=existing.completion_percentage,
                is_completed=existing.is_course_completed,
            )

        enrollment = CourseUserModel(user_id=request.user_id, course_id=course_id)
        self.session.add(enrollment)
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            return None
        await self.session.refresh(enrollment)

        return CourseEnrollmentDTO(
            user_id=enrollment.user_id,
            name=_user_display_name(user),
            progress=0.0,
            is_completed=False,
        )
