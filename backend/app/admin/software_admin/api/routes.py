from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, status

from app.admin.software_admin.usecases.assign_manager_block_usecase import AssignManagerBlockUseCase
from app.admin.software_admin.usecases.assign_user_block_usecase import AssignUserBlockUseCase
from app.admin.software_admin.usecases.block_user_usecase import BlockUserUseCase
from app.admin.software_admin.usecases.change_user_role_usecase import ChangeUserRoleUseCase
from app.admin.software_admin.usecases.create_user_usecase import CreateUserUseCase
from app.admin.software_admin.usecases.remove_manager_block_usecase import RemoveManagerBlockUseCase
from app.admin.software_admin.usecases.remove_user_block_usecase import RemoveUserBlockUseCase
from app.admin.software_admin.usecases.unblock_user_usecase import UnblockUserUseCase
from app.admin.staff_admin.usecases.profiles.delete_employee_profile_usecase import DeleteEmployeeProfileUseCase
from app.auth.deps import AuthContext, require_software_admin
from app.locations.dto import BlockMemberDTO
from app.personnel.dto import DeleteResultDTO
from app.users.domain import ChangeUserRoleRequest, ManagerBlockAssignRequest, UserBlockRequest, UserCreate
from app.users.dto import ManagerBlockDTO, UserCreateResultDTO, UserDTO, UsersListDTO
from app.users.usecases.list_users_usecase import ListUsersUseCase

router = APIRouter(route_class=DishkaRoute)


@router.get("/users", response_model=UsersListDTO, summary="Список всех пользователей")
async def list_users(
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[ListUsersUseCase],
	role: str | None = None,
	is_active: bool | None = None,
) -> UsersListDTO:
	return await usecase.execute(role=role, is_active=is_active)


@router.post("/users", response_model=UserCreateResultDTO, summary="Создать пользователя")
async def create_user(
	request: UserCreate,
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[CreateUserUseCase],
) -> UserCreateResultDTO:
	return await usecase.execute(request)


@router.delete(
	"/users/{user_id}",
	response_model=DeleteResultDTO,
	summary="Удалить пользователя (любая роль кроме super_admin)",
)
async def delete_user(
	user_id: UUID,
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[DeleteEmployeeProfileUseCase],
) -> DeleteResultDTO:
	return await usecase.execute(user_id, auth)


@router.patch(
	"/users/{user_id}/role",
	response_model=UserDTO,
	summary="Изменить роль пользователя",
)
async def change_user_role(
	user_id: UUID,
	request: ChangeUserRoleRequest,
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[ChangeUserRoleUseCase],
) -> UserDTO:
	return await usecase.execute(user_id, request.role, auth)


@router.patch("/users/{user_id}/block", response_model=UserDTO, summary="Блокировать пользователя")
async def block_user(
	user_id: UUID,
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[BlockUserUseCase],
) -> UserDTO:
	result = await usecase.execute(user_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
	return result


@router.patch("/users/{user_id}/unblock", response_model=UserDTO, summary="Разблокировать пользователя")
async def unblock_user(
	user_id: UUID,
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[UnblockUserUseCase],
) -> UserDTO:
	result = await usecase.execute(user_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
	return result


@router.post(
	"/users/{user_id}/blocks",
	response_model=ManagerBlockDTO,
	summary="Назначить менеджера на блок",
)
async def assign_manager_block(
	user_id: UUID,
	request: ManagerBlockAssignRequest,
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[AssignManagerBlockUseCase],
) -> ManagerBlockDTO:
	result = await usecase.execute(user_id, request.block_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager or block not found")
	return result


@router.post(
	"/users/{user_id}/block",
	response_model=BlockMemberDTO,
	summary="Назначить пользователя на блок",
)
async def assign_user_block(
	user_id: UUID,
	request: UserBlockRequest,
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[AssignUserBlockUseCase],
) -> BlockMemberDTO:
	result = await usecase.execute(user_id, request.block_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or block not found")
	return result


@router.delete(
	"/users/{user_id}/block",
	status_code=status.HTTP_204_NO_CONTENT,
	summary="Удалить пользователя из блока",
)
async def remove_user_block(
	user_id: UUID,
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[RemoveUserBlockUseCase],
) -> None:
	result = await usecase.execute(user_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
	if not result:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block assignment not found")


@router.delete(
	"/users/{user_id}/blocks/{block_id}",
	status_code=status.HTTP_204_NO_CONTENT,
	summary="Снять менеджера с блока",
)
async def remove_manager_block(
	user_id: UUID,
	block_id: int,
	auth: Annotated[AuthContext, Depends(require_software_admin)],
	usecase: FromDishka[RemoveManagerBlockUseCase],
) -> None:
	result = await usecase.execute(user_id, block_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manager assignment not found")
