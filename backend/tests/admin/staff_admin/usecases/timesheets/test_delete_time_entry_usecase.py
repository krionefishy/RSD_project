import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.timesheets.delete_time_entry_usecase import DeleteTimeEntryUseCase
from app.personnel.db_models import EmployeeTimeEntryModel
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from tests.builder import Builder


class TestDeleteTimeEntryUseCase:
    async def test_deletes_time_entry(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        entry = await builder.build_time_entry()
        ctx = builder.auth_context_for(admin)

        result = await DeleteTimeEntryUseCase(db_session).execute(entry.id, ctx)

        assert result.deleted is True
        check = await db_session.execute(
            select(EmployeeTimeEntryModel).where(EmployeeTimeEntryModel.id == entry.id)
        )
        assert check.scalar_one_or_none() is None

    async def test_raises_not_found_for_missing_entry(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        admin = await builder.default_admin_staff
        ctx = builder.auth_context_for(admin)

        with pytest.raises(ProfileNotFoundError):
            await DeleteTimeEntryUseCase(db_session).execute(999999, ctx)

    async def test_raises_forbidden_for_seller(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        entry = await builder.build_time_entry(user=seller)
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await DeleteTimeEntryUseCase(db_session).execute(entry.id, ctx)
