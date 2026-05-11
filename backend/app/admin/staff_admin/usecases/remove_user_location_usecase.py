from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.locations.db_models import UserLocationModel
from app.users.db_models import UserModel


class RemoveUserLocationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, user_id) -> Optional[bool]:
        user_result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        if user_result.scalar_one_or_none() is None:
            return None

        result = await self.session.execute(
            delete(UserLocationModel).where(UserLocationModel.user_id == user_id)
        )
        await self.session.commit()

        return result.rowcount > 0
