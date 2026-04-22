import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.domain import RefreshRequest
from app.auth.dto import TokenPairDTO
from app.auth.errors import (
    RefreshInvalidError,
    TokenExpiredError,
    TokenInvalidError,
)
from app.auth.redis_store import RefreshTokenStore
from app.auth.tokens import TokenError, create_access_token, create_refresh_token, decode_token
from app.users.db_models import UserModel
from shared.settings.config import Settings

logger = logging.getLogger("auth.refresh")


class RefreshTokensUseCase:
    def __init__(
        self,
        session: AsyncSession,
        refresh_store: RefreshTokenStore,
        settings: Settings,
    ):
        self.session = session
        self.refresh_store = refresh_store
        self.settings = settings

    async def execute(self, request: RefreshRequest) -> TokenPairDTO:
        try:
            payload = decode_token(self.settings, request.refresh_token, expected_type="refresh")
        except TokenError as exc:
            if exc.code == "TOKEN_EXPIRED":
                raise TokenExpiredError(exc.message) from exc
            raise TokenInvalidError(exc.message) from exc

        user_id = UUID(payload["sub"])
        jti = payload.get("jti")
        if not jti:
            raise RefreshInvalidError()

        if not await self.refresh_store.exists(user_id, jti):
            await self.refresh_store.delete_all_for_user(user_id)
            raise RefreshInvalidError()

        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            await self.refresh_store.delete_all_for_user(user_id)
            raise RefreshInvalidError()

        await self.refresh_store.delete(user_id, jti)

        access_token, expires_in = create_access_token(self.settings, user.id, user.role.value)
        refresh_token, new_jti, _ = create_refresh_token(self.settings, user.id, user.role.value)
        await self.refresh_store.save(user.id, new_jti)

        return TokenPairDTO(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=expires_in,
            user_id=user.id,
            role=user.role.value,
        )
