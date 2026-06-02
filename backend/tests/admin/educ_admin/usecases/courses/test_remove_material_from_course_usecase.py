from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.remove_material_from_course_usecase import (
    RemoveMaterialFromCourseUseCase,
)
from app.knowledge_base.db_models import CourseMaterialModel
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestRemoveMaterialFromCourseUseCase:
    async def test_removes_material_from_course_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course, materials, _ = await builder.build_course_with_materials(material_count=1)

        result = await RemoveMaterialFromCourseUseCase(db_session).execute(
            course.id,
            materials[0].id,
            admin_ctx(education_admin),
        )

        assert result is True
        remaining = (
            await db_session.execute(
                select(CourseMaterialModel).where(
                    CourseMaterialModel.course_id == course.id,
                    CourseMaterialModel.material_id == materials[0].id,
                )
            )
        ).scalar_one_or_none()
        assert remaining is None

    async def test_returns_none_when_assignment_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        material = await builder.build_material()

        result = await RemoveMaterialFromCourseUseCase(db_session).execute(
            course.id,
            material.id,
            admin_ctx(education_admin),
        )

        assert result is None
