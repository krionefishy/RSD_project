from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.auth.deps import AuthContext, require_staff_admin
from app.users.domain import UserAdminUpdate, UserLocationRequest
from app.users.dto import AvatarUploadResultDTO, TempPasswordDTO, UserDTO, UserLocationDTO, UsersListDTO
from app.admin.staff_admin.usecases.assign_user_location_usecase import AssignUserLocationUseCase
from app.admin.staff_admin.usecases.remove_user_location_usecase import RemoveUserLocationUseCase
from app.admin.staff_admin.usecases.reset_password_usecase import ResetPasswordUseCase
from app.admin.staff_admin.usecases.update_user_admin_usecase import UpdateUserAdminUseCase
from app.admin.staff_admin.usecases.upload_avatar_usecase import UploadAvatarUseCase
from app.users.usecases.list_users_usecase import ListUsersUseCase

router = APIRouter(route_class=DishkaRoute)

MAX_AVATAR_SIZE = 2 * 1024 * 1024
ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png"}


@router.get("/users", response_model=UsersListDTO, summary="Админский список пользователей")
async def list_users_for_admin(
	_: Annotated[AuthContext, Depends(require_staff_admin)],
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


@router.patch("/users/{user_id}", response_model=UserDTO, summary="Обновить профиль сотрудника")
async def update_user_profile(
	user_id: UUID,
	request: UserAdminUpdate,
	auth: Annotated[AuthContext, Depends(require_staff_admin)],
	usecase: FromDishka[UpdateUserAdminUseCase],
) -> UserDTO:
	result = await usecase.execute(user_id, request)
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
	if file.content_type not in ALLOWED_AVATAR_TYPES:
		raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid file type")
	payload = await file.read()
	if len(payload) > MAX_AVATAR_SIZE:
		raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

	avatar_url = await usecase.execute(
		user_id,
		filename=file.filename or "avatar",
		content_type=file.content_type or "application/octet-stream",
		payload=payload,
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
	temp_password = await usecase.execute(user_id)
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
	result = await usecase.execute(user_id, request.location_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or location not found")
	return result


@router.delete(
	"/users/{user_id}/location",
	status_code=status.HTTP_204_NO_CONTENT,
	summary="Удалить пользователя с точки",
)
async def remove_user_location(
	user_id: UUID,
	auth: Annotated[AuthContext, Depends(require_staff_admin)],
	usecase: FromDishka[RemoveUserLocationUseCase],
) -> None:
	result = await usecase.execute(user_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
	if not result:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location assignment not found")
