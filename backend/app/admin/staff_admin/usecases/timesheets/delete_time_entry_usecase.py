from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.db_models import EmployeeTimeEntryModel
from app.personnel.dto import DeleteResultDTO
from app.users.profile_errors import ProfileNotFoundError
from app.users.profile_scope import require_staff_admin


class DeleteTimeEntryUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, time_entry_id: int, ctx: AuthContext) -> DeleteResultDTO:
        require_staff_admin(ctx)

        result = await self.session.execute(
            select(EmployeeTimeEntryModel).where(EmployeeTimeEntryModel.id == time_entry_id)
        )
        entry = result.scalar_one_or_none()
        if entry is None:
            raise ProfileNotFoundError("Time entry not found")

        await self.session.execute(
            delete(EmployeeTimeEntryModel).where(EmployeeTimeEntryModel.id == time_entry_id)
        )
        await self.session.commit()
        return DeleteResultDTO(deleted=True)
