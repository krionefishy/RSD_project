from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.admin.staff_admin.usecases.get_personnel_overview_usecase import GetPersonnelOverviewUseCase
from app.admin.staff_admin.usecases.assign_user_location_usecase import AssignUserLocationUseCase
from app.admin.staff_admin.usecases.remove_user_location_usecase import RemoveUserLocationUseCase
from app.admin.staff_admin.usecases.reset_password_usecase import ResetPasswordUseCase
from app.admin.staff_admin.usecases.update_user_admin_usecase import UpdateUserAdminUseCase
from app.admin.staff_admin.usecases.upload_avatar_usecase import UploadAvatarUseCase
from app.auth.deps import AuthContext, require_staff_admin
from app.personnel.dto import DeleteResultDTO
from app.users.domain import UserAdminUpdate, UserLocationRequest
from app.admin.staff_admin.dto import PersonnelOverviewDTO
from app.users.dto import AvatarUploadResultDTO, TempPasswordDTO, UserDTO, UserLocationDTO, UsersListDTO
from app.users.usecases.list_users_usecase import ListUsersUseCase

router = APIRouter(route_class=DishkaRoute)


@router.get("/overview", response_model=PersonnelOverviewDTO, summary="Сводка для админа персонала")
async def get_personnel_overview(
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[GetPersonnelOverviewUseCase],
) -> PersonnelOverviewDTO:
    return await usecase.execute(auth)


@router.get("/users", response_model=UsersListDTO, summary="Админский список пользователей")
async def list_users_for_admin(
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
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
        viewer_role=auth.role,
    )


@router.patch("/users/{user_id}", response_model=UserDTO, summary="Обновить профиль сотрудника")
async def update_user_profile(
    user_id: UUID,
    request: UserAdminUpdate,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[UpdateUserAdminUseCase],
) -> UserDTO:
    result = await usecase.execute(user_id, request, auth)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return result


@router.post(
    "/users/{user_id}/avatar",
    response_model=AvatarUploadResultDTO,
    summary="Загрузить аватар",
)
async def upload_avatar(
    user_id: UUID,
    file: UploadFile,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[UploadAvatarUseCase],
) -> AvatarUploadResultDTO:
    payload = await file.read()

    avatar_url = await usecase.execute(
        user_id,
        filename=file.filename or "avatar",
        content_type=file.content_type or "application/octet-stream",
        payload=payload,
        ctx=auth,
    )
    if avatar_url is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return AvatarUploadResultDTO(avatar_url=avatar_url)


@router.post(
    "/users/{user_id}/reset-password",
    response_model=TempPasswordDTO,
    summary="Сбросить пароль",
)
async def reset_password(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[ResetPasswordUseCase],
) -> TempPasswordDTO:
    temp_password = await usecase.execute(user_id, auth)
    if temp_password is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return TempPasswordDTO(temp_password=temp_password)


@router.post(
    "/users/{user_id}/location",
    response_model=UserLocationDTO,
    summary="Назначить пользователя на точку",
)
async def assign_user_location(
    user_id: UUID,
    request: UserLocationRequest,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[AssignUserLocationUseCase],
) -> UserLocationDTO:
    result = await usecase.execute(user_id, request.location_id, auth)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or location not found")
    return result


@router.delete(
    "/users/{user_id}/location",
    response_model=DeleteResultDTO,
    summary="Удалить пользователя с точки",
)
async def remove_user_location(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[RemoveUserLocationUseCase],
) -> DeleteResultDTO:
    result = await usecase.execute(user_id, auth)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location assignment not found")
    return DeleteResultDTO(deleted=True)
