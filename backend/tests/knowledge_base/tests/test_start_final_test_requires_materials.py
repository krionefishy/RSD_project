from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.domain import StartTestRequest, UserContext
from app.knowledge_base.usecases.tests.start_test_usecase import StartTestUseCase
from app.users.db_models import UserRole
from tests.builder import Builder


class TestStartFinalTestRequiresMaterials:
    async def test_blocks_final_test_until_all_materials_are_completed(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="final_blocked_until_materials",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=2)
        await builder.build_course_user(user=seller, course=course)
        test = await builder.build_test(name="Final test", is_final=True)
        await builder.build_course_test(course=course, test=test, is_final=True)
        await builder.build_test_task_assignment(test=test, task=await builder.build_test_task(name="Task 1"), order=0)
        await builder.build_user_course_material(
            user=seller,
            course=course,
            material=materials[0],
            is_completed=True,
        )
        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)

        result = await StartTestUseCase(db_session).execute(request, ctx)

        assert result is None

    async def test_allows_final_test_when_all_materials_are_completed(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="final_allowed_after_materials",
            role=UserRole.SELLER,
        )
        course, materials, _ = await builder.build_course_with_materials(material_count=2)
        await builder.build_course_user(user=seller, course=course)
        test = await builder.build_test(name="Final test", is_final=True)
        task = await builder.build_test_task(name="Task 1")
        await builder.build_course_test(course=course, test=test, is_final=True)
        await builder.build_test_task_assignment(test=test, task=task, order=0)
        for material in materials:
            await builder.build_user_course_material(
                user=seller,
                course=course,
                material=material,
                is_completed=True,
            )
        request = StartTestRequest(course_id=course.id, test_id=test.id)
        ctx = UserContext(user_id=seller.id, role=UserRole.SELLER)

        result = await StartTestUseCase(db_session).execute(request, ctx)

        assert result is not None
        assert result.first_task.id == task.id
