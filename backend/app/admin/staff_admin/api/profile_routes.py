from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends

from app.admin.staff_admin.usecases.profiles.block_employee_profile_usecase import (
    BlockEmployeeProfileUseCase,
)
from app.admin.staff_admin.usecases.profiles.change_block_member_status_usecase import (
    ChangeBlockMemberStatusUseCase,
)
from app.admin.staff_admin.usecases.profiles.change_employee_position_usecase import (
    ChangeEmployeePositionUseCase,
)
from app.admin.staff_admin.usecases.profiles.create_employee_profile_usecase import (
    CreateEmployeeProfileUseCase,
)
from app.admin.staff_admin.usecases.profiles.delete_employee_profile_usecase import (
    DeleteEmployeeProfileUseCase,
)
from app.admin.staff_admin.usecases.profiles.unblock_employee_profile_usecase import (
    UnblockEmployeeProfileUseCase,
)
from app.admin.staff_admin.usecases.profiles.update_employee_profile_usecase import (
    UpdateEmployeeProfileUseCase,
)
from app.auth.deps import AuthContext, require_staff_admin
from app.personnel.domain import (
    ChangeBlockMemberStatusRequest,
    ChangeEmployeePositionRequest,
    CreateEmployeeProfileRequest,
    UpdateEmployeeProfileRequest,
)
from app.personnel.dto import CreateEmployeeProfileResultDTO, DeleteResultDTO
from app.users.dto import UserProfileDTO

router = APIRouter(route_class=DishkaRoute)


@router.post(
    "/employees",
    response_model=CreateEmployeeProfileResultDTO,
    summary="Создать профиль сотрудника",
)
async def create_employee_profile(
    request: CreateEmployeeProfileRequest,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[CreateEmployeeProfileUseCase],
) -> CreateEmployeeProfileResultDTO:
    return await usecase.execute(request, auth)


@router.patch(
    "/users/{user_id}/employee-profile",
    response_model=UserProfileDTO,
    summary="Обновить профиль сотрудника",
)
async def update_employee_profile(
    user_id: UUID,
    request: UpdateEmployeeProfileRequest,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[UpdateEmployeeProfileUseCase],
) -> UserProfileDTO:
    return await usecase.execute(user_id, request, auth)


@router.delete(
    "/users/{user_id}/employee-profile",
    response_model=DeleteResultDTO,
    summary="Удалить профиль сотрудника",
)
async def delete_employee_profile(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[DeleteEmployeeProfileUseCase],
) -> DeleteResultDTO:
    return await usecase.execute(user_id, auth)


@router.post(
    "/users/{user_id}/block-profile",
    response_model=UserProfileDTO,
    summary="Заблокировать профиль сотрудника",
)
async def block_employee_profile(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[BlockEmployeeProfileUseCase],
    reason: str | None = None,
) -> UserProfileDTO:
    return await usecase.execute(user_id, auth, reason=reason)


@router.post(
    "/users/{user_id}/unblock-profile",
    response_model=UserProfileDTO,
    summary="Разблокировать профиль сотрудника",
)
async def unblock_employee_profile(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[UnblockEmployeeProfileUseCase],
) -> UserProfileDTO:
    return await usecase.execute(user_id, auth)


@router.patch(
    "/users/{user_id}/position",
    response_model=UserProfileDTO,
    summary="Изменить должность продавца",
)
async def change_employee_position(
    user_id: UUID,
    request: ChangeEmployeePositionRequest,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[ChangeEmployeePositionUseCase],
) -> UserProfileDTO:
    return await usecase.execute(user_id, request, auth)


@router.patch(
    "/users/{user_id}/block-member-status",
    response_model=UserProfileDTO,
    summary="Изменить статус основа/резерв в блоке",
)
async def change_block_member_status(
    user_id: UUID,
    request: ChangeBlockMemberStatusRequest,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[ChangeBlockMemberStatusUseCase],
) -> UserProfileDTO:
    return await usecase.execute(user_id, request, auth)
