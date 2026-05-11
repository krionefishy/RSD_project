from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, HTTPException, status

from app.auth.deps import AuthContext
from app.users.db_models import UserRole
from app.users.domain import ManagerBlockAssignRequest, UserBlockRequest, UserCreate
from app.locations.dto import BlockMemberDTO
from app.users.dto import ManagerBlockDTO, UserCreateResultDTO, UserDTO
from app.admin.software_admin.usecases.assign_manager_block_usecase import AssignManagerBlockUseCase
from app.admin.software_admin.usecases.assign_user_block_usecase import AssignUserBlockUseCase
from app.admin.software_admin.usecases.block_user_usecase import BlockUserUseCase
from app.admin.software_admin.usecases.create_user_usecase import CreateUserUseCase
from app.admin.software_admin.usecases.remove_user_block_usecase import RemoveUserBlockUseCase
from app.admin.software_admin.usecases.unblock_user_usecase import UnblockUserUseCase

router = APIRouter(route_class=DishkaRoute)


def _require_software_admin(auth: AuthContext) -> None:
	allowed = {UserRole.ROOT_ADMIN.value, UserRole.SUPER_ADMIN.value}
	if auth.role not in allowed:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@router.post("/users", response_model=UserCreateResultDTO, summary="Создать пользователя")
async def create_user(
	request: UserCreate,
	auth: FromDishka[AuthContext],
	usecase: FromDishka[CreateUserUseCase],
) -> UserCreateResultDTO:
	_require_software_admin(auth)
	return await usecase.execute(request)


@router.patch("/users/{user_id}/block", response_model=UserDTO, summary="Блокировать пользователя")
async def block_user(
	user_id: UUID,
	auth: FromDishka[AuthContext],
	usecase: FromDishka[BlockUserUseCase],
) -> UserDTO:
	_require_software_admin(auth)
	result = await usecase.execute(user_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
	return result


@router.patch("/users/{user_id}/unblock", response_model=UserDTO, summary="Разблокировать пользователя")
async def unblock_user(
	user_id: UUID,
	auth: FromDishka[AuthContext],
	usecase: FromDishka[UnblockUserUseCase],
) -> UserDTO:
	_require_software_admin(auth)
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
	auth: FromDishka[AuthContext],
	usecase: FromDishka[AssignManagerBlockUseCase],
) -> ManagerBlockDTO:
	_require_software_admin(auth)
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
	auth: FromDishka[AuthContext],
	usecase: FromDishka[AssignUserBlockUseCase],
) -> BlockMemberDTO:
	_require_software_admin(auth)
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
	auth: FromDishka[AuthContext],
	usecase: FromDishka[RemoveUserBlockUseCase],
) -> None:
	_require_software_admin(auth)
	result = await usecase.execute(user_id)
	if result is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
	if not result:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block assignment not found")
