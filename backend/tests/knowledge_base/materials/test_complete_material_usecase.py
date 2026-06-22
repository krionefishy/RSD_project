from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.db_models import UserCourseMaterialModel
from app.knowledge_base.domain import CompleteMaterialRequest, UserContext
from app.knowledge_base.usecases.materials.complete_material_usecase import CompleteMaterialUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestCompleteMaterialUseCase:
    async def test_completes_material_for_assigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="seller_complete",
            first_name="John",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        await builder.build_course_user(user=seller, course=course)
        request = CompleteMaterialRequest(
            course_id=course.id,
            material_id=materials[0].id,
        )
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = CompleteMaterialUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is not None
        assert result.material_id == materials[0].id
        assert result.course_id == course.id

    async def test_returns_none_for_not_enrolled_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="not_enrolled_mat",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        request = CompleteMaterialRequest(
            course_id=course.id,
            material_id=materials[0].id,
        )
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = CompleteMaterialUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is None

    async def test_is_idempotent_when_material_was_already_completed(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="seller_complete_twice",
            first_name="John",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        await builder.build_course_user(user=seller, course=course)
        request = CompleteMaterialRequest(
            course_id=course.id,
            material_id=materials[0].id,
        )
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = CompleteMaterialUseCase(db_session)

        first = await usecase.execute(request, ctx)
        second = await usecase.execute(request, ctx)

        completions = (
            await db_session.execute(
                select(UserCourseMaterialModel).where(
                    UserCourseMaterialModel.user_id == seller.id,
                    UserCourseMaterialModel.course_id == course.id,
                    UserCourseMaterialModel.material_id == materials[0].id,
                )
            )
        ).scalars().all()

        assert first is not None
        assert second is not None
        assert len(completions) == 1

    async def test_returns_none_for_non_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        manager = await builder.build_user(
            external_system_id="manager_mat",
            first_name="Manager",
            role=UserRole.MANAGER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        request = CompleteMaterialRequest(
            course_id=course.id,
            material_id=materials[0].id,
        )
        ctx = UserContext(user_id=manager.id, role=UserRole.MANAGER)
        usecase = CompleteMaterialUseCase(db_session)

        result = await usecase.execute(request, ctx)

        assert result is None
