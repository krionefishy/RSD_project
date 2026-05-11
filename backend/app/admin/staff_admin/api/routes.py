from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, HTTPException, UploadFile, status

from app.auth.deps import AuthContext
from app.users.db_models import UserRole
from app.users.domain import UserAdminUpdate, UserLocationRequest
from app.users.dto import AvatarUploadResultDTO, TempPasswordDTO, UserDTO, UserLocationDTO
from app.admin.staff_admin.usecases.assign_user_location_usecase import AssignUserLocationUseCase
from app.admin.staff_admin.usecases.remove_user_location_usecase import RemoveUserLocationUseCase
from app.admin.staff_admin.usecases.reset_password_usecase import ResetPasswordUseCase
from app.admin.staff_admin.usecases.update_user_admin_usecase import UpdateUserAdminUseCase
from app.admin.staff_admin.usecases.upload_avatar_usecase import UploadAvatarUseCase

router = APIRouter(route_class=DishkaRoute)

MAX_AVATAR_SIZE = 2 * 1024 * 1024
ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png"}


def _require_staff_admin(auth: AuthContext) -> None:
	allowed = {
		UserRole.ADMIN_STAFF.value,
		UserRole.ROOT_ADMIN.value,
		UserRole.SUPER_ADMIN.value,
	}
	if auth.role not in allowed:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.patch("/users/{user_id}", response_model=UserDTO, summary="Обновить профиль сотрудника")
async def update_user_profile(
	user_id: UUID,
	request: UserAdminUpdate,
	auth: FromDishka[AuthContext],
	usecase: FromDishka[UpdateUserAdminUseCase],
) -> UserDTO:
	_require_staff_admin(auth)
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
	auth: FromDishka[AuthContext],
	usecase: FromDishka[UploadAvatarUseCase],
) -> AvatarUploadResultDTO:
	_require_staff_admin(auth)
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
	auth: FromDishka[AuthContext],
	usecase: FromDishka[ResetPasswordUseCase],
) -> TempPasswordDTO:
	_require_staff_admin(auth)
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
	auth: FromDishka[AuthContext],
	usecase: FromDishka[AssignUserLocationUseCase],
) -> UserLocationDTO:
	_require_staff_admin(auth)
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
	auth: FromDishka[AuthContext],
	usecase: FromDishka[RemoveUserLocationUseCase],
) -> None:
	_require_staff_admin(auth)
	result = await usecase.execute(user_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
	if not result:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location assignment not found")
