from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import UserContext
from app.knowledge_base.usecases.materials.get_material_usecase import GetMaterialByIdUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestGetMaterialByIdUseCase:
    async def test_returns_material_for_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        ctx = UserContext(user_id=uuid4(), role=UserRole.ADMIN_EDUCATION)
        usecase = GetMaterialByIdUseCase(db_session)

        result = await usecase.execute(materials[0].id, course.id, ctx)

        assert result is not None
        assert result.id == materials[0].id
        assert result.course_id == course.id

    async def test_returns_material_for_assigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="seller_material",
            first_name="John",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        await builder.build_course_user(user=seller, course=course)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = GetMaterialByIdUseCase(db_session)

        result = await usecase.execute(materials[0].id, course.id, ctx)

        assert result is not None
        assert result.id == materials[0].id

    async def test_returns_none_for_unassigned_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="unassigned_mat",
            first_name="Jane",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)
        usecase = GetMaterialByIdUseCase(db_session)

        result = await usecase.execute(materials[0].id, course.id, ctx)

        assert result is None

    async def test_returns_none_for_nonexistent_material(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        course = await builder.build_course()
        ctx = UserContext(user_id=uuid4(), role=UserRole.ADMIN_EDUCATION)
        usecase = GetMaterialByIdUseCase(db_session)

        result = await usecase.execute(99999, course.id, ctx)

        assert result is None

    async def test_returns_material_for_manager(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        course, materials, _ = await builder.build_course_with_materials(material_count=1)
        ctx = UserContext(user_id=uuid4(), role=UserRole.MANAGER)
        usecase = GetMaterialByIdUseCase(db_session)

        result = await usecase.execute(materials[0].id, course.id, ctx)

        assert result is not None
        assert result.id == materials[0].id
