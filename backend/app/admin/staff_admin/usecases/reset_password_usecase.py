import secrets
import string
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.password import PasswordService
from app.auth.redis_store import RefreshTokenStore
from app.users.db_models import UserModel


def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class ResetPasswordUseCase:
    def __init__(
        self,
        session: AsyncSession,
        password_service: PasswordService,
        refresh_store: RefreshTokenStore,
    ):
        self.session = session
        self.password_service = password_service
        self.refresh_store = refresh_store

    async def execute(self, user_id) -> Optional[str]:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None

        temp_password = _generate_temp_password()
        user.hashed_password = self.password_service.hash(temp_password)
        user.is_temp_password = True
        await self.session.commit()

        await self.refresh_store.delete_all_for_user(user.id)

        return temp_password
