from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.admin.educ_admin.domain import AssignCourseEnrollmentRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import (
    CourseMaterialModel,
    CourseModel,
    CourseTestModel,
    CourseUserModel,
    UserCourseMaterialModel,
    UserCourseTestModel,
)
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseEnrollmentDTO
from app.users.db_models import UserModel


def _user_display_name(user: UserModel) -> str:
    parts = [user.last_name, user.first_name, user.middle_name]
    name = " ".join(part for part in parts if part)
    return name or user.external_system_id


async def _calculate_progress_percent(
    session: AsyncSession,
    *,
    course_id: int,
    user_id,
) -> float:
    materials_total = await session.scalar(
        select(func.count(CourseMaterialModel.id)).where(CourseMaterialModel.course_id == course_id)
    )
    tests_total = await session.scalar(
        select(func.count(CourseTestModel.id)).where(CourseTestModel.course_id == course_id)
    )
    materials_completed = await session.scalar(
        select(func.count(UserCourseMaterialModel.id)).where(
            UserCourseMaterialModel.course_id == course_id,
            UserCourseMaterialModel.user_id == user_id,
            UserCourseMaterialModel.is_completed.is_(True),
        )
    )
    tests_completed = await session.scalar(
        select(func.count(UserCourseTestModel.id)).where(
            UserCourseTestModel.course_id == course_id,
            UserCourseTestModel.user_id == user_id,
            UserCourseTestModel.is_passed.is_(True),
            UserCourseTestModel.completed_at.is_not(None),
        )
    )
    total_items = int(materials_total or 0) + int(tests_total or 0)
    if total_items == 0:
        return 0.0
    completed_items = int(materials_completed or 0) + int(tests_completed or 0)
    return round((completed_items / total_items) * 100, 2)


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
        user_query = select(UserModel)
        if request.user_id is not None:
            user_query = user_query.where(UserModel.id == request.user_id)
        else:
            user_query = user_query.where(UserModel.external_system_id == request.external_system_id)
        user = (await self.session.execute(user_query)).scalar_one_or_none()
        if course is None or user is None:
            return None

        existing = (
            await self.session.execute(
                select(CourseUserModel)
                .where(
                    CourseUserModel.course_id == course_id,
                    CourseUserModel.user_id == user.id,
                )
                .options(selectinload(CourseUserModel.course))
            )
        ).scalar_one_or_none()
        if existing is not None:
            return CourseEnrollmentDTO(
                user_id=existing.user_id,
                external_system_id=user.external_system_id,
                name=_user_display_name(user),
                progress=await _calculate_progress_percent(
                    self.session,
                    course_id=course_id,
                    user_id=user.id,
                ),
                is_completed=existing.is_course_completed,
            )

        enrollment = CourseUserModel(user_id=user.id, course_id=course_id)
        self.session.add(enrollment)
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            return None
        await self.session.refresh(enrollment)

        return CourseEnrollmentDTO(
            user_id=enrollment.user_id,
            external_system_id=user.external_system_id,
            name=_user_display_name(user),
            progress=0.0,
            is_completed=False,
        )
