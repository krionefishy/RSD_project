from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import AssignMaterialToCourseRequest
from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import CourseMaterialModel, CourseModel, MaterialModel
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import CourseMaterialItemDTO


class AssignMaterialToCourseUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        request: AssignMaterialToCourseRequest,
        ctx: UserContext,
    ) -> Optional[CourseMaterialItemDTO]:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        course = (
            await self.session.execute(select(CourseModel).where(CourseModel.id == course_id))
        ).scalar_one_or_none()
        material = (
            await self.session.execute(
                select(MaterialModel).where(MaterialModel.id == request.material_id)
            )
        ).scalar_one_or_none()
        if course is None or material is None:
            return None

        existing = (
            await self.session.execute(
                select(CourseMaterialModel).where(
                    CourseMaterialModel.course_id == course_id,
                    CourseMaterialModel.material_id == request.material_id,
                )
            )
        ).scalar_one_or_none()
        if existing is not None:
            return CourseMaterialItemDTO(
                id=existing.id,
                material_id=material.id,
                name=material.name,
                category=material.category,
                description=material.description,
                is_completed=False,
            )

        link = CourseMaterialModel(course_id=course_id, material_id=request.material_id)
        self.session.add(link)
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            return None
        await self.session.refresh(link)

        return CourseMaterialItemDTO(
            id=link.id,
            material_id=material.id,
            name=material.name,
            category=material.category,
            description=material.description,
            is_completed=False,
        )
