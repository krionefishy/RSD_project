from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.dto import PersonnelOverviewDTO
from app.auth.deps import AuthContext
from app.locations.db_models import BlockModel, LocationModel
from app.users.db_models import UserModel, UserRole
from app.users.profile_scope import require_staff_admin


class GetPersonnelOverviewUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, ctx: AuthContext) -> PersonnelOverviewDTO:
        require_staff_admin(ctx)

        employees_count = (
            await self.session.execute(
                select(func.count(UserModel.id)).where(
                    UserModel.role.in_([UserRole.SELLER.value, UserRole.MANAGER.value]),
                    UserModel.is_active.is_(True),
                )
            )
        ).scalar_one()

        locations_count = (
            await self.session.execute(select(func.count(LocationModel.id)))
        ).scalar_one()

        blocks_count = (
            await self.session.execute(select(func.count(BlockModel.id)))
        ).scalar_one()

        return PersonnelOverviewDTO(
            employees_count=employees_count,
            locations_count=locations_count,
            blocks_count=blocks_count,
        )
