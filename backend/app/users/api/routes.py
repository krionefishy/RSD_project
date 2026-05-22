from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, HTTPException, status

from app.auth.deps import AuthContext
from app.users.dto import UserDTO, UsersListDTO
from app.users.usecases.get_user_usecase import GetUserUseCase
from app.users.usecases.list_users_usecase import ListUsersUseCase

router = APIRouter(route_class=DishkaRoute)


@router.get("", response_model=UsersListDTO, summary="Список пользователей")
async def list_users(
    _: FromDishka[AuthContext],
    usecase: FromDishka[ListUsersUseCase],
    block_id: int | None = None,
    location_id: int | None = None,
    role: str | None = None,
    is_active: bool | None = None,
) -> UsersListDTO:
    return await usecase.execute(
        block_id=block_id,
        location_id=location_id,
        role=role,
        is_active=is_active,
    )


@router.get("/me", response_model=UserDTO, summary="Текущий пользователь")
async def get_current_user(
    auth: FromDishka[AuthContext],
    usecase: FromDishka[GetUserUseCase],
) -> UserDTO:
    user = await usecase.execute(UUID(auth.user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/{user_id}", response_model=UserDTO, summary="Пользователь по id")
async def get_user(
    user_id: UUID,
    _: FromDishka[AuthContext],
    usecase: FromDishka[GetUserUseCase],
) -> UserDTO:
    user = await usecase.execute(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
