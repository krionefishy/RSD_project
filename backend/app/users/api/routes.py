from uuid import UUID

from dishka.integrations.fastapi import FromDishka
from fastapi import APIRouter, HTTPException, status

from app.auth.deps import AuthContext
from app.users.dto import UserDTO
from app.users.usecases.get_user_usecase import GetUserUseCase

router = APIRouter()


@router.get("/me", response_model=UserDTO, summary="Текущий пользователь")
async def get_current_user(
    auth: AuthContext = FromDishka[AuthContext],
    usecase: GetUserUseCase = FromDishka[GetUserUseCase],
) -> UserDTO:
    user = await usecase.execute(UUID(auth.user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/{user_id}", response_model=UserDTO, summary="Пользователь по id")
async def get_user(
    user_id: UUID,
    _: AuthContext = FromDishka[AuthContext],
    usecase: GetUserUseCase = FromDishka[GetUserUseCase],
) -> UserDTO:
    user = await usecase.execute(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
