from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, status

from app.admin.super_admin.domain import CreateBlockRequest, CreateLocationRequest, UpdateBlockRequest, UpdateLocationRequest
from app.admin.super_admin.usecases.assign_root_admin_usecase import AssignRootAdminUseCase
from app.admin.super_admin.usecases.block_usecases import (
    CreateBlockUseCase,
    DeleteBlockUseCase,
    GetBlockUseCase,
    ListBlocksUseCase,
    UpdateBlockUseCase,
)
from app.admin.super_admin.usecases.location_usecases import (
    AssignLocationToBlockUseCase,
    CreateLocationUseCase,
    DeleteLocationUseCase,
    GetLocationUseCase,
    ListLocationsUseCase,
    RemoveLocationFromBlockUseCase,
    UpdateLocationUseCase,
)
from app.admin.super_admin.usecases.remove_root_admin_usecase import RemoveRootAdminUseCase
from app.auth.deps import AuthContext, require_structure_admin, require_structure_viewer, require_super_admin
from app.locations.structure_dto import (
    BlockDetailDTO,
    BlockListItemDTO,
    BlocksListDTO,
    LocationDetailDTO,
    LocationListItemDTO,
    LocationsListDTO,
)
from app.users.dto import UserDTO, UsersListDTO
from app.users.usecases.list_users_usecase import ListUsersUseCase

router = APIRouter(route_class=DishkaRoute)


@router.get("/users", response_model=UsersListDTO, summary="Список всех пользователей (Super Admin)")
async def list_all_users(
    auth: Annotated[AuthContext, Depends(require_super_admin)],
    usecase: FromDishka[ListUsersUseCase],
    role: str | None = None,
    is_active: bool | None = None,
) -> UsersListDTO:
    return await usecase.execute(role=role, is_active=is_active)


@router.post(
    "/users/{user_id}/root-admin",
    response_model=UserDTO,
    summary="Назначить root_admin",
)
async def assign_root_admin(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_super_admin)],
    usecase: FromDishka[AssignRootAdminUseCase],
) -> UserDTO:
    return await usecase.execute(user_id, auth)


@router.delete(
    "/users/{user_id}/root-admin",
    response_model=UserDTO,
    summary="Снять root_admin (понизить до seller)",
)
async def remove_root_admin(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_super_admin)],
    usecase: FromDishka[RemoveRootAdminUseCase],
) -> UserDTO:
    return await usecase.execute(user_id, auth)


@router.get("/blocks", response_model=BlocksListDTO, summary="Список блоков")
async def list_blocks(
    auth: Annotated[AuthContext, Depends(require_structure_viewer)],
    usecase: FromDishka[ListBlocksUseCase],
    block_id: int | None = None,
) -> BlocksListDTO:
    return await usecase.execute(auth, block_id=block_id)


@router.get("/blocks/{block_id}", response_model=BlockDetailDTO, summary="Карточка блока")
async def get_block(
    block_id: int,
    auth: Annotated[AuthContext, Depends(require_structure_viewer)],
    usecase: FromDishka[GetBlockUseCase],
) -> BlockDetailDTO:
    result = await usecase.execute(block_id, auth)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    return result


@router.post("/blocks", response_model=BlockListItemDTO, summary="Создать блок")
async def create_block(
    request: CreateBlockRequest,
    _: Annotated[AuthContext, Depends(require_structure_admin)],
    usecase: FromDishka[CreateBlockUseCase],
) -> BlockListItemDTO:
    return await usecase.execute(request)


@router.put("/blocks/{block_id}", response_model=BlockListItemDTO, summary="Изменить блок")
async def update_block(
    block_id: int,
    request: UpdateBlockRequest,
    _: Annotated[AuthContext, Depends(require_structure_admin)],
    usecase: FromDishka[UpdateBlockUseCase],
) -> BlockListItemDTO:
    result = await usecase.execute(block_id, request)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    return result


@router.delete("/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить блок")
async def delete_block(
    block_id: int,
    _: Annotated[AuthContext, Depends(require_structure_admin)],
    usecase: FromDishka[DeleteBlockUseCase],
) -> None:
    if not await usecase.execute(block_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")


@router.get("/locations", response_model=LocationsListDTO, summary="Список точек")
async def list_locations(
    auth: Annotated[AuthContext, Depends(require_structure_viewer)],
    usecase: FromDishka[ListLocationsUseCase],
    block_id: int | None = None,
    location_id: int | None = None,
) -> LocationsListDTO:
    return await usecase.execute(auth, block_id=block_id, location_id=location_id)


@router.get("/locations/{location_id}", response_model=LocationDetailDTO, summary="Карточка точки")
async def get_location(
    location_id: int,
    auth: Annotated[AuthContext, Depends(require_structure_viewer)],
    usecase: FromDishka[GetLocationUseCase],
) -> LocationDetailDTO:
    result = await usecase.execute(location_id, auth)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return result


@router.post("/locations", response_model=LocationListItemDTO, summary="Создать точку")
async def create_location(
    request: CreateLocationRequest,
    _: Annotated[AuthContext, Depends(require_structure_admin)],
    usecase: FromDishka[CreateLocationUseCase],
) -> LocationListItemDTO:
    return await usecase.execute(request)


@router.put("/locations/{location_id}", response_model=LocationListItemDTO, summary="Изменить точку")
async def update_location(
    location_id: int,
    request: UpdateLocationRequest,
    _: Annotated[AuthContext, Depends(require_structure_admin)],
    usecase: FromDishka[UpdateLocationUseCase],
) -> LocationListItemDTO:
    result = await usecase.execute(location_id, request)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return result


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить точку")
async def delete_location(
    location_id: int,
    _: Annotated[AuthContext, Depends(require_structure_admin)],
    usecase: FromDishka[DeleteLocationUseCase],
) -> None:
    if not await usecase.execute(location_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")


@router.post(
    "/blocks/{block_id}/locations/{location_id}",
    response_model=LocationListItemDTO,
    summary="Привязать точку к блоку",
)
async def assign_location_to_block(
    block_id: int,
    location_id: int,
    _: Annotated[AuthContext, Depends(require_structure_admin)],
    usecase: FromDishka[AssignLocationToBlockUseCase],
) -> LocationListItemDTO:
    return await usecase.execute(block_id, location_id)


@router.delete(
    "/blocks/{block_id}/locations/{location_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить точку из блока",
)
async def remove_location_from_block(
    block_id: int,
    location_id: int,
    _: Annotated[AuthContext, Depends(require_structure_admin)],
    usecase: FromDishka[RemoveLocationFromBlockUseCase],
) -> None:
    if not await usecase.execute(block_id, location_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
