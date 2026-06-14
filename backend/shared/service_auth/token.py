"""Issue and validate inter-service JWT tokens."""

from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt

from shared.settings.config import ServiceJWTConfig


class ServiceTokenError(Exception):
    pass


def create_service_token(
    config: ServiceJWTConfig,
    *,
    subject: str = "backend",
    scope: str | None = None,
) -> str:
    if subject not in config.allowed_subjects:
        raise ServiceTokenError(f"Subject {subject!r} is not allowed to mint service tokens")

    now = datetime.now(UTC)
    payload: dict[str, object] = {
        "sub": subject,
        "type": "service",
        "iss": config.issuer,
        "aud": config.audience,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=config.expire_seconds)).timestamp()),
    }
    if scope:
        payload["scope"] = scope
    return jwt.encode(payload, config.secret, algorithm=config.algorithm)


def decode_service_token(token: str, config: ServiceJWTConfig) -> dict:
    try:
        payload = jwt.decode(
            token,
            config.secret,
            algorithms=[config.algorithm],
            issuer=config.issuer,
            audience=config.audience,
        )
    except JWTError as exc:
        raise ServiceTokenError("Invalid service token") from exc

    if payload.get("type") != "service":
        raise ServiceTokenError("Invalid service token type")

    subject = payload.get("sub")
    if not subject or subject not in config.allowed_subjects:
        raise ServiceTokenError("Invalid service token subject")

    return payload
