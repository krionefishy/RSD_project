import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.domain import LoginRequest
from app.auth.dto import TokenPairDTO
from app.auth.errors import DecryptFailedError, InvalidCredentialsError
from app.auth.password import DecryptError, PasswordService
from app.auth.redis_store import RefreshTokenStore
from app.auth.tokens import create_access_token, create_refresh_token
from app.users.db_models import UserModel
from shared.settings.config import Settings

logger = logging.getLogger("auth.login")


class LoginUserUseCase:
    def __init__(
        self,
        session: AsyncSession,
        password_service: PasswordService,
        refresh_store: RefreshTokenStore,
        settings: Settings,
    ):
        self.session = session
        self.password_service = password_service
        self.refresh_store = refresh_store
        self.settings = settings

    async def execute(self, request: LoginRequest) -> TokenPairDTO:
        try:
            raw_password = self.password_service.decrypt(request.encrypted_password)
        except DecryptError as exc:
            logger.info("login decrypt failed: %s", exc)
            raise DecryptFailedError() from exc

        result = await self.session.execute(
            select(UserModel).where(UserModel.external_system_id == request.external_system_id)
        )
        user = result.scalar_one_or_none()

        if user is None or not self.password_service.verify(raw_password, user.hashed_password):
            raise InvalidCredentialsError()

        access_token, expires_in = create_access_token(self.settings, user.id, user.role.value)
        refresh_token, refresh_jti, _ = create_refresh_token(self.settings, user.id, user.role.value)
        await self.refresh_store.save(user.id, refresh_jti)

        return TokenPairDTO(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
            user_id=user.id,
            role=user.role.value,
        )
