from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from shared.service_auth.token import decode_service_token
from shared.settings.config import Settings


@dataclass(frozen=True)
class ServiceAuthContext:
    subject: str
    scope: str | None = None


async def require_service_auth(
    request: Request,
) -> ServiceAuthContext:
    settings = await request.state.dishka_container.get(Settings)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing service token",
        )

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing service token",
        )

    try:
        payload = decode_service_token(token, settings.service_jwt)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service token",
        ) from exc

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed service token",
        )

    return ServiceAuthContext(subject=subject, scope=payload.get("scope"))


ServiceAuth = Annotated[ServiceAuthContext, Depends(require_service_auth)]
