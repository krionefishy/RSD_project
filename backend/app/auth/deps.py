from dataclasses import dataclass
from typing import Optional

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.errors import TokenInvalidError, TokenMissingError
from app.auth.tokens import TokenError, decode_token
from app.users.db_models import UserModel
from shared.settings.config import Settings


@dataclass
class AuthContext:
    user_id: str
    role: str


async def build_auth_context(
    request: Request,
    session: AsyncSession,
    settings: Settings,
) -> AuthContext:
    auth_header: Optional[str] = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise TokenMissingError()

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise TokenMissingError()

    try:
        payload = decode_token(settings, token, expected_type="access")
    except TokenError as exc:
        if exc.code == "TOKEN_EXPIRED":
            from app.auth.errors import TokenExpiredError
            raise TokenExpiredError(exc.message) from exc
        raise TokenInvalidError(exc.message) from exc

    user_id = payload["sub"]
    result = await session.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise TokenInvalidError("User not found")

    return AuthContext(user_id=str(user.id), role=user.role)
