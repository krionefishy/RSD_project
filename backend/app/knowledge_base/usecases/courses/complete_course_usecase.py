from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.db_models import (
    CourseMaterialModel,
    CourseModel,
    CourseTestModel,
    CourseUserModel,
    UserCourseMaterialModel,
    UserCourseTestModel,
)
from app.knowledge_base.domain import CompleteCourseRequest, UserContext
from app.knowledge_base.dto import CompleteCourseResultDTO
from app.knowledge_base.usecases.progress import recalculate_course_user_points
from app.users.db_models import UserRole


class CompleteCourseUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        request: CompleteCourseRequest,
        ctx: UserContext,
    ) -> Optional[CompleteCourseResultDTO]:
        if ctx.role != UserRole.SELLER:
            return None

        course_user_result = await self.session.execute(
            select(CourseUserModel).where(
                CourseUserModel.user_id == ctx.user_id,
                CourseUserModel.course_id == request.course_id,
            )
        )
        course_user = course_user_result.scalar_one_or_none()
        if course_user is None:
            return None

        course_result = await self.session.execute(
            select(CourseModel).where(CourseModel.id == request.course_id)
        )
        course = course_result.scalar_one_or_none()
        if course is None:
            return None

        refreshed_course_user = await recalculate_course_user_points(
            self.session,
            course_id=request.course_id,
            user_id=ctx.user_id,
        )
        if refreshed_course_user is not None:
            course_user = refreshed_course_user

        completed_materials_result = await self.session.execute(
            select(func.count(UserCourseMaterialModel.id)).where(
                UserCourseMaterialModel.user_id == ctx.user_id,
                UserCourseMaterialModel.course_id == request.course_id,
                UserCourseMaterialModel.is_completed == True,
            )
        )
        completed_materials = completed_materials_result.scalar() or 0

        total_materials_result = await self.session.execute(
            select(func.count(CourseMaterialModel.id)).where(
                CourseMaterialModel.course_id == request.course_id,
            )
        )
        total_materials = total_materials_result.scalar() or 0

        passed_tests_result = await self.session.execute(
            select(func.count(UserCourseTestModel.id)).where(
                UserCourseTestModel.user_id == ctx.user_id,
                UserCourseTestModel.course_id == request.course_id,
                UserCourseTestModel.is_passed == True,
            )
        )
        passed_tests = passed_tests_result.scalar() or 0

        total_tests_result = await self.session.execute(
            select(func.count(CourseTestModel.id)).where(
                CourseTestModel.course_id == request.course_id,
            )
        )
        total_tests = total_tests_result.scalar() or 0

        user_points = course_user.user_points_by_course
        required_points = course.mrp

        if course_user.is_course_completed:
            return CompleteCourseResultDTO(
                course_id=request.course_id,
                completed=False,
                message="Курс уже завершён",
                completed_materials=completed_materials,
                total_materials=total_materials,
                passed_tests=passed_tests,
                total_tests=total_tests,
                user_points=user_points,
                required_points=required_points,
            )

        can_complete = True
        missing_items = []

        if completed_materials < total_materials:
            can_complete = False
            missing_items.append(
                f"материалов: {completed_materials}/{total_materials}"
            )

        if passed_tests < total_tests:
            can_complete = False
            missing_items.append(
                f"тестов: {passed_tests}/{total_tests}"
            )

        if user_points < required_points:
            can_complete = False
            missing_items.append(
                f"баллов: {user_points}/{required_points}"
            )

        if not can_complete:
            return CompleteCourseResultDTO(
                course_id=request.course_id,
                completed=False,
                message=f"Не выполнены требования: {', '.join(missing_items)}",
                completed_materials=completed_materials,
                total_materials=total_materials,
                passed_tests=passed_tests,
                total_tests=total_tests,
                user_points=user_points,
                required_points=required_points,
            )

        course_user.is_course_completed = True
        course_user.is_course_completed_successfully = True
        await self.session.commit()

        return CompleteCourseResultDTO(
            course_id=request.course_id,
            completed=True,
            message="Курс успешно завершён!",
            completed_materials=completed_materials,
            total_materials=total_materials,
            passed_tests=passed_tests,
            total_tests=total_tests,
            user_points=user_points,
            required_points=required_points,
        )
