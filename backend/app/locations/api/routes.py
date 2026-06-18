"""Public read-only routes for blocks and locations.

Available to: manager, admin_staff, root_admin, super_admin (require_structure_viewer).
These routes reuse ListBlocksUseCase and ListLocationsUseCase from super_admin without
duplicating logic.  Managers automatically get their own scope filtered inside the UCs.
"""

from typing import Annotated

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends

from app.admin.super_admin.usecases.block_usecases import ListBlocksUseCase
from app.admin.super_admin.usecases.location_usecases import ListLocationsUseCase
from app.auth.deps import AuthContext, require_structure_viewer
from app.locations.structure_dto import BlocksListDTO, LocationsListDTO

router = APIRouter(route_class=DishkaRoute)


@router.get(
    "/blocks",
    response_model=BlocksListDTO,
    summary="Список блоков (read-only для менеджера и выше)",
)
async def list_blocks(
    auth: Annotated[AuthContext, Depends(require_structure_viewer)],
    usecase: FromDishka[ListBlocksUseCase],
    block_id: int | None = None,
) -> BlocksListDTO:
    return await usecase.execute(auth, block_id=block_id)


@router.get(
    "/locations",
    response_model=LocationsListDTO,
    summary="Список точек (read-only для менеджера и выше)",
)
async def list_locations(
    auth: Annotated[AuthContext, Depends(require_structure_viewer)],
    usecase: FromDishka[ListLocationsUseCase],
    block_id: int | None = None,
    location_id: int | None = None,
) -> LocationsListDTO:
    return await usecase.execute(auth, block_id=block_id, location_id=location_id)
