import time
from uuid import UUID, uuid4

from jose import ExpiredSignatureError, JWTError, jwt

from shared.settings.config import Settings


class TokenError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def create_access_token(settings: Settings, user_id: UUID, role: str) -> tuple[str, int]:
    now = int(time.time())
    expires_in = settings.jwt.access_expire_seconds
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": now,
        "exp": now + expires_in,
    }
    token = jwt.encode(payload, settings.jwt.secret, algorithm=settings.jwt.algorithm)
    return token, expires_in


def create_refresh_token(settings: Settings, user_id: UUID, role: str) -> tuple[str, str, int]:
    now = int(time.time())
    expires_in = settings.jwt.refresh_expire_seconds
    jti = uuid4().hex
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "refresh",
        "jti": jti,
        "iat": now,
        "exp": now + expires_in,
    }
    token = jwt.encode(payload, settings.jwt.secret, algorithm=settings.jwt.algorithm)
    return token, jti, expires_in


def decode_token(settings: Settings, token: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt.secret,
            algorithms=[settings.jwt.algorithm],
        )
    except ExpiredSignatureError as exc:
        raise TokenError("TOKEN_EXPIRED", "Token expired") from exc
    except JWTError as exc:
        raise TokenError("TOKEN_INVALID", "Invalid token") from exc

    if payload.get("type") != expected_type:
        raise TokenError("TOKEN_INVALID", f"Expected {expected_type} token")

    sub = payload.get("sub")
    if not sub:
        raise TokenError("TOKEN_INVALID", "Token payload is malformed")

    try:
        UUID(sub)
    except ValueError as exc:
        raise TokenError("TOKEN_INVALID", "Token sub is not a valid UUID") from exc

    return payload
