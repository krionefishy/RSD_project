from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.db_models import EmployeeTimeEntryModel
from app.personnel.dto import DeleteResultDTO
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileNotFoundError
from app.users.profile_scope import ensure_staff_admin_can_manage_user, require_staff_admin


class DeleteTimeEntryUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, time_entry_id: int, ctx: AuthContext) -> DeleteResultDTO:
        require_staff_admin(ctx)

        result = await self.session.execute(
            select(EmployeeTimeEntryModel, UserModel)
            .join(UserModel, UserModel.id == EmployeeTimeEntryModel.user_id)
            .where(EmployeeTimeEntryModel.id == time_entry_id)
        )
        row = result.one_or_none()
        if row is None:
            raise ProfileNotFoundError("Time entry not found")
        entry, user = row
        ensure_staff_admin_can_manage_user(ctx, user.role)

        await self.session.execute(
            delete(EmployeeTimeEntryModel).where(EmployeeTimeEntryModel.id == time_entry_id)
        )
        await self.session.commit()
        return DeleteResultDTO(deleted=True)
