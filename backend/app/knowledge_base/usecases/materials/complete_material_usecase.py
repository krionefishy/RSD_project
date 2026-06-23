from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.db_models import (
    CourseMaterialModel,
    CourseUserModel,
    UserCourseMaterialModel,
)
from app.knowledge_base.domain import CompleteMaterialRequest, UserContext
from app.knowledge_base.dto import CompleteMaterialResultDTO
from app.users.db_models import UserRole


class CompleteMaterialUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        request: CompleteMaterialRequest,
        ctx: UserContext,
    ) -> Optional[CompleteMaterialResultDTO]:
        if ctx.role != UserRole.SELLER:
            return None

        access_result = await self.session.execute(
            select(CourseMaterialModel.id)
            .join(
                CourseUserModel,
                CourseUserModel.course_id == CourseMaterialModel.course_id,
            )
            .where(
                CourseMaterialModel.course_id == request.course_id,
                CourseMaterialModel.material_id == request.material_id,
                CourseUserModel.user_id == ctx.user_id,
            )
        )
        if access_result.scalar_one_or_none() is None:
            return None

        completed_at = datetime.now()
        existing_completion_result = await self.session.execute(
            select(UserCourseMaterialModel).where(
                UserCourseMaterialModel.user_id == ctx.user_id,
                UserCourseMaterialModel.course_id == request.course_id,
                UserCourseMaterialModel.material_id == request.material_id,
            )
        )
        completion = existing_completion_result.scalar_one_or_none()
        if completion is None:
            self.session.add(
                UserCourseMaterialModel(
                    user_id=ctx.user_id,
                    course_id=request.course_id,
                    material_id=request.material_id,
                    is_completed=True,
                    completed_at=completed_at,
                )
            )
        else:
            completion.is_completed = True
            completion.completed_at = completion.completed_at or completed_at
            completion.updated_at = datetime.now()
        await self.session.commit()

        return CompleteMaterialResultDTO(
            material_id=request.material_id,
            course_id=request.course_id,
        )
