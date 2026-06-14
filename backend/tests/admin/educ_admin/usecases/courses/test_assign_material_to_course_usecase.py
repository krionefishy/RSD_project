from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import AssignMaterialToCourseRequest
from app.admin.educ_admin.usecases.courses.assign_material_to_course_usecase import (
    AssignMaterialToCourseUseCase,
)
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestAssignMaterialToCourseUseCase:
    async def test_assigns_material_to_course_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()
        material = await builder.build_material(name="Linked Material")

        result = await AssignMaterialToCourseUseCase(db_session).execute(
            course.id,
            AssignMaterialToCourseRequest(material_id=material.id),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.material_id == material.id
        assert result.name == "Linked Material"

    async def test_returns_existing_link_when_already_assigned(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course, materials, _ = await builder.build_course_with_materials(material_count=1)

        result = await AssignMaterialToCourseUseCase(db_session).execute(
            course.id,
            AssignMaterialToCourseRequest(material_id=materials[0].id),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.material_id == materials[0].id

    async def test_returns_none_when_material_not_found(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course()

        result = await AssignMaterialToCourseUseCase(db_session).execute(
            course.id,
            AssignMaterialToCourseRequest(material_id=999999),
            admin_ctx(education_admin),
        )

        assert result is None
