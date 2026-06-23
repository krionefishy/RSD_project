from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.list_course_test_task_bank_usecase import (
    ListCourseTestTaskBankUseCase,
)
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestListCourseTestTaskBankUseCase:
    async def test_lists_unique_tasks_from_course_tests(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        course = await builder.build_course(name="Course A")
        test_a = await builder.build_test(name="Quiz A")
        test_b = await builder.build_test(name="Quiz B")
        shared_task = await builder.build_test_task(name="Shared task", points=5)
        own_task = await builder.build_test_task(name="Own task", points=3)

        await builder.build_course_test(course=course, test=test_a, is_final=False)
        await builder.build_course_test(course=course, test=test_b, is_final=False)
        await builder.build_test_task_assignment(test=test_a, task=shared_task, order=0)
        await builder.build_test_task_assignment(test=test_b, task=shared_task, order=0)
        await builder.build_test_task_assignment(test=test_b, task=own_task, order=1)

        result = await ListCourseTestTaskBankUseCase(db_session).execute(course.id, admin_ctx(education_admin))

        assert result is not None
        assert len(result.items) == 2
        assert {item.task_name for item in result.items} == {"Shared task", "Own task"}
