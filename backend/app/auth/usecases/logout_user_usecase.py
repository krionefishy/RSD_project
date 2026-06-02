import logging
from uuid import UUID

from app.auth.domain import LogoutRequest
from app.auth.redis_store import RefreshTokenStore
from app.auth.tokens import TokenError, decode_token
from shared.settings.config import Settings

logger = logging.getLogger("auth.logout")


class LogoutUserUseCase:
    def __init__(
        self,
        refresh_store: RefreshTokenStore,
        settings: Settings,
    ):
        self.refresh_store = refresh_store
        self.settings = settings

    async def execute(self, request: LogoutRequest) -> None:
        try:
            payload = decode_token(self.settings, request.refresh_token, expected_type="refresh")
        except TokenError:
            return

        jti = payload.get("jti")
        if not jti:
            return

        user_id = UUID(payload["sub"])
        await self.refresh_store.delete(user_id, jti)
