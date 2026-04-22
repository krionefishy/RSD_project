from fastapi import APIRouter, Response, status
from dishka.integrations.fastapi import FromDishka

from app.auth.deps import AuthContext
from app.auth.domain import LoginRequest, LogoutRequest, RefreshRequest
from app.auth.dto import PublicKeyDTO, TokenPairDTO
from app.auth.rsa_keys import RsaKeyProvider
from app.auth.usecases.login_user_usecase import LoginUserUseCase
from app.auth.usecases.logout_user_usecase import LogoutUserUseCase
from app.auth.usecases.refresh_tokens_usecase import RefreshTokensUseCase

router = APIRouter()


@router.get(
    "/public-key",
    response_model=PublicKeyDTO,
    summary="Публичный ключ RSA для шифрования пароля",
)
async def get_public_key(
    rsa_keys: RsaKeyProvider = FromDishka[RsaKeyProvider],
) -> PublicKeyDTO:
    return PublicKeyDTO(public_key_pem=rsa_keys.get_public_key_pem())


@router.post(
    "/login",
    response_model=TokenPairDTO,
    summary="Логин по email+RSA-OAEP",
)
async def login(
    request: LoginRequest,
    usecase: LoginUserUseCase = FromDishka[LoginUserUseCase],
) -> TokenPairDTO:
    return await usecase.execute(request)


@router.post(
    "/refresh",
    response_model=TokenPairDTO,
    summary="Ротация refresh-токена",
)
async def refresh(
    request: RefreshRequest,
    usecase: RefreshTokensUseCase = FromDishka[RefreshTokensUseCase],
) -> TokenPairDTO:
    return await usecase.execute(request)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Инвалидация refresh-токена текущей сессии",
)
async def logout(
    request: LogoutRequest,
    _: AuthContext = FromDishka[AuthContext],
    usecase: LogoutUserUseCase = FromDishka[LogoutUserUseCase],
) -> Response:
    await usecase.execute(request)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
