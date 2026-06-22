from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_CONTENT_VIEW_ALL_ROLES
from app.knowledge_base.db_models import (
    CourseMaterialModel,
    CourseModel,
    CourseTestModel,
    CourseUserModel,
    TestModel,
    UserCourseMaterialModel,
    UserCourseTestModel,
)
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseDTO, CourseMaterialItemDTO, CourseTestItemDTO
from app.users.db_models import UserRole


class GetCourseByIdUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        ctx: UserContext,
    ) -> Optional[CourseDTO]:
        if ctx.role.value not in KB_CONTENT_VIEW_ALL_ROLES and ctx.role != UserRole.SELLER:
            return None

        if ctx.role == UserRole.SELLER:
            enrollment_result = await self.session.execute(
                select(CourseUserModel)
                .where(
                    CourseUserModel.user_id == ctx.user_id,
                    CourseUserModel.course_id == course_id,
                )
                .options(
                    selectinload(CourseUserModel.course).selectinload(
                        CourseModel.course_materials
                    ).selectinload(CourseMaterialModel.material),
                    selectinload(CourseUserModel.course).selectinload(
                        CourseModel.course_tests
                    ).selectinload(CourseTestModel.test).selectinload(TestModel.task_assignments),
                )
            )
            enrollment = enrollment_result.scalar_one_or_none()
            if enrollment is None or enrollment.course is None:
                return None
            course = enrollment.course
            user_points_by_course = enrollment.user_points_by_course
            is_course_completed = enrollment.is_course_completed

            completed_rows = await self.session.execute(
                select(UserCourseMaterialModel.material_id).where(
                    UserCourseMaterialModel.user_id == ctx.user_id,
                    UserCourseMaterialModel.course_id == course_id,
                    UserCourseMaterialModel.is_completed.is_(True),
                )
            )
            completed_material_ids = set(completed_rows.scalars().all())

            user_tests_rows = await self.session.execute(
                select(UserCourseTestModel).where(
                    UserCourseTestModel.user_id == ctx.user_id,
                    UserCourseTestModel.course_id == course_id,
                )
            )
            user_tests_by_test_id = {
                ut.test_id: ut for ut in user_tests_rows.scalars().all()
            }

        else:
            user_points_by_course = None
            is_course_completed = None
            completed_material_ids = set()
            user_tests_by_test_id = {}

            course_result = await self.session.execute(
                select(CourseModel)
                .where(CourseModel.id == course_id)
                .options(
                    selectinload(CourseModel.course_materials).selectinload(
                        CourseMaterialModel.material
                    ),
                    selectinload(CourseModel.course_tests).selectinload(
                        CourseTestModel.test
                    ).selectinload(TestModel.task_assignments),
                )
            )
            course = course_result.scalar_one_or_none()
            if course is None:
                return None

        materials = [
            CourseMaterialItemDTO(
                id=cm.id,
                material_id=cm.material_id,
                name=cm.material.name if cm.material else "",
                category=cm.material.category if cm.material else "",
                description=cm.material.description if cm.material else None,
                is_completed=cm.material_id in completed_material_ids,
            )
            for cm in (course.course_materials or [])
        ]

        tests = []
        for ct in course.course_tests or []:
            ut = user_tests_by_test_id.get(ct.test_id)
            tests.append(
                CourseTestItemDTO(
                    id=ct.id,
                    test_id=ct.test_id,
                    name=ct.test.name if ct.test else "",
                    category=ct.test.category if ct.test else "",
                    is_final=ct.is_final,
                    tasks_count=ct.test.tasks_count if ct.test else 0,
                    is_passed=ut.is_passed if ut else False,
                    score=ut.score if ut else None,
                )
            )

        return CourseDTO(
            id=course.id,
            name=course.name,
            description=course.description,
            rating_points=course.rating_points,
            mrp=course.mrp,
            materials_count=course.materials_count,
            tests_count=course.tests_count,
            created_at=course.created_at,
            materials=materials,
            tests=tests,
            user_points_by_course=user_points_by_course,
            is_course_completed=is_course_completed,
        )
