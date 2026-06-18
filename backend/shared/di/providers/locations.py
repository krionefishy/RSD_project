from dishka import Provider, Scope, provide

from app.admin.software_admin.usecases.remove_manager_block_usecase import RemoveManagerBlockUseCase
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


class LocationsUsecaseProvider(Provider):
    scope = Scope.REQUEST

    list_blocks = provide(ListBlocksUseCase)
    get_block = provide(GetBlockUseCase)
    create_block = provide(CreateBlockUseCase)
    update_block = provide(UpdateBlockUseCase)
    delete_block = provide(DeleteBlockUseCase)

    list_locations = provide(ListLocationsUseCase)
    get_location = provide(GetLocationUseCase)
    create_location = provide(CreateLocationUseCase)
    update_location = provide(UpdateLocationUseCase)
    delete_location = provide(DeleteLocationUseCase)
    assign_location_to_block = provide(AssignLocationToBlockUseCase)
    remove_location_from_block = provide(RemoveLocationFromBlockUseCase)

    remove_manager_block = provide(RemoveManagerBlockUseCase)
    assign_root_admin = provide(AssignRootAdminUseCase)
    remove_root_admin = provide(RemoveRootAdminUseCase)
