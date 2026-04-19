from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, ExpiredSignatureError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from dishka.integrations.fastapi import FromDishka

from app.users.db_models import UserModel
from shared.settings.config import Settings


security = HTTPBearer()


@dataclass
class AuthContext:
    """Authentication context extracted from JWT token."""
    valid: bool
    user_id: Optional[str] = None
    role: Optional[str] = None


def _verify_jwt_token(
    token: str,
    settings: Settings,
) -> Optional[dict]:
    """
    Verify JWT token signature and extract payload.

    Args:
        token: JWT token string (without "Bearer " prefix)
        settings: Application settings with JWT config

    Returns:
        Token payload dict if valid, None if invalid

    Raises:
        ExpiredSignatureError: If token is expired (handled by caller)
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt.secret,
            algorithms=[settings.jwt.algorithm],
        )
        if payload.get("type") != "access":
            return None
        return payload
    except ExpiredSignatureError:
        raise
    except JWTError:
        return None


async def validate_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = FromDishka[AsyncSession],
    settings: Settings = FromDishka[Settings],
) -> AuthContext:
    """
    Validate JWT token and return authentication context.

    Token format: Authorization: Bearer <jwt_token>

    Error handling:
    - 403: Token invalid (bad signature, malformed, missing Bearer, wrong type)
    - 401: Token expired or user not found in database

    Args:
        credentials: HTTP Bearer token
        session: Database session
        settings: Application settings

    Returns:
        AuthContext with user_id and role if valid

    Raises:
        HTTPException: 401 or 403 with appropriate detail
    """
    token = credentials.credentials

    # Decode and validate JWT
    try:
        payload = _verify_jwt_token(token, settings)
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token",
        )

    # Extract user_id from sub claim
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token: missing user_id",
        )

    # Verify user exists in database
    query = select(UserModel).where(UserModel.id == user_id)
    result = await session.execute(query)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return AuthContext(
        valid=True,
        user_id=str(user.id),
        role=user.role.value,
    )


async def require_auth(
    auth_context: AuthContext = Depends(validate_jwt_token),
) -> AuthContext:
    """
    Require valid authentication.

    This is a wrapper around validate_jwt_token that ensures
    the token was successfully validated.

    Args:
        auth_context: Authentication context from validate_jwt_token

    Returns:
        AuthContext with user_id and role

    Raises:
        HTTPException: 401 if authentication is missing/invalid
    """
    if not auth_context.valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return auth_context
