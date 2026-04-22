from fastapi import Request
from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext, build_auth_context
from app.auth.password import PasswordService
from app.auth.redis_store import RefreshTokenStore
from app.auth.rsa_keys import RsaKeyProvider
from app.auth.usecases.login_user_usecase import LoginUserUseCase
from app.auth.usecases.logout_user_usecase import LogoutUserUseCase
from app.auth.usecases.refresh_tokens_usecase import RefreshTokensUseCase
from shared.settings.config import Settings


class AuthProvider(Provider):
    rsa_keys = provide(RsaKeyProvider, scope=Scope.APP)
    password_service = provide(PasswordService, scope=Scope.APP)
    refresh_store = provide(RefreshTokenStore, scope=Scope.APP)


class AuthContextProvider(Provider):
    scope = Scope.REQUEST

    @provide
    async def auth_context(
        self,
        request: Request,
        session: AsyncSession,
        settings: Settings,
    ) -> AuthContext:
        return await build_auth_context(request, session, settings)


class AuthUsecaseProvider(Provider):
    scope = Scope.REQUEST

    login_user = provide(LoginUserUseCase)
    refresh_tokens = provide(RefreshTokensUseCase)
    logout_user = provide(LogoutUserUseCase)
