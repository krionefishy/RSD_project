from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.domain import UpdateTestRequest
from app.admin.educ_admin.usecases.tests.update_test_usecase import UpdateTestUseCase
from app.users.db_models import UserModel
from tests.admin.educ_admin.conftest import admin_ctx
from tests.builder import Builder


class TestUpdateTestUseCase:
    async def test_updates_test_when_education_admin(
        self,
        db_session: AsyncSession,
        builder: Builder,
        education_admin: UserModel,
    ) -> None:
        test = await builder.build_test(name="Old Test")

        result = await UpdateTestUseCase(db_session).execute(
            test.id,
            UpdateTestRequest(name="Updated Test", pass_score_percent=90),
            admin_ctx(education_admin),
        )

        assert result is not None
        assert result.name == "Updated Test"
        assert result.pass_score_percent == 90

    async def test_returns_none_when_test_not_found(
        self,
        db_session: AsyncSession,
        education_admin: UserModel,
    ) -> None:
        result = await UpdateTestUseCase(db_session).execute(
            999999,
            UpdateTestRequest(name="Missing"),
            admin_ctx(education_admin),
        )

        assert result is None
