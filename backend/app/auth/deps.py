from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.errors import AccountInactiveError, TokenInvalidError, TokenMissingError
from app.auth.tokens import TokenError, decode_token
from app.users.db_models import UserModel, UserRole
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
    if not user.is_active:
        raise AccountInactiveError()

    return AuthContext(user_id=str(user.id), role=user.role)


async def _get_auth_context(request: Request) -> AuthContext:
    container = request.state.dishka_container
    return await container.get(AuthContext)


def require_any_role(auth: AuthContext, allowed_roles: set[str]) -> AuthContext:
    if auth.role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return auth


async def require_auth(request: Request) -> AuthContext:
    return await _get_auth_context(request)


async def require_staff_admin(request: Request) -> AuthContext:
    auth = await _get_auth_context(request)
    return require_any_role(
        auth,
        {
            UserRole.ADMIN_STAFF.value,
            UserRole.ROOT_ADMIN.value,
            UserRole.SUPER_ADMIN.value,
        },
    )


async def require_personnel_viewer(request: Request) -> AuthContext:
    auth = await _get_auth_context(request)
    return require_any_role(
        auth,
        {
            UserRole.MANAGER.value,
            UserRole.ADMIN_STAFF.value,
            UserRole.ROOT_ADMIN.value,
            UserRole.SUPER_ADMIN.value,
        },
    )


async def require_manager(request: Request) -> AuthContext:
    auth = await _get_auth_context(request)
    return require_any_role(auth, {UserRole.MANAGER.value})


async def require_software_admin(request: Request) -> AuthContext:
    auth = await _get_auth_context(request)
    return require_any_role(
        auth,
        {
            UserRole.ROOT_ADMIN.value,
            UserRole.SUPER_ADMIN.value,
        },
    )


async def require_structure_viewer(request: Request) -> AuthContext:
    auth = await _get_auth_context(request)
    return require_any_role(
        auth,
        {
            UserRole.MANAGER.value,
            UserRole.ADMIN_STAFF.value,
            UserRole.ROOT_ADMIN.value,
            UserRole.SUPER_ADMIN.value,
        },
    )


async def require_structure_admin(request: Request) -> AuthContext:
    return await require_software_admin(request)


async def require_education_admin(request: Request) -> AuthContext:
    auth = await _get_auth_context(request)
    return require_any_role(
        auth,
        {
            UserRole.ADMIN_EDUCATION.value,
            UserRole.ROOT_ADMIN.value,
            UserRole.SUPER_ADMIN.value,
        },
    )


async def require_super_admin(request: Request) -> AuthContext:
    auth = await _get_auth_context(request)
    return require_any_role(auth, {UserRole.SUPER_ADMIN.value})
