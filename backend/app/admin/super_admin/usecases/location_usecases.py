from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.super_admin.domain import CreateLocationRequest, UpdateLocationRequest
from app.auth.deps import AuthContext
from app.locations.db_models import BlockLocationModel, BlockModel, LocationModel, UserLocationModel
from app.locations.structure_dto import LocationDetailDTO, LocationListItemDTO, LocationsListDTO
from app.locations.structure_queries import (
    count_users_by_location,
    location_ids_for_blocks,
    manager_block_ids,
)
from app.users.db_models import UserModel
from app.users.dto import UserBriefDTO


def _user_brief(user: UserModel) -> UserBriefDTO:
    return UserBriefDTO(
        id=user.id,
        external_system_id=user.external_system_id,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
    )


async def _location_block_info(
    session: AsyncSession,
    location_ids: list[int],
) -> dict[int, tuple[int, str]]:
    if not location_ids:
        return {}
    result = await session.execute(
        select(BlockLocationModel.location_id, BlockModel.id, BlockModel.name)
        .join(BlockModel, BlockModel.id == BlockLocationModel.block_id)
        .where(BlockLocationModel.location_id.in_(location_ids))
    )
    return {row[0]: (row[1], row[2]) for row in result.all()}


class ListLocationsUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        auth: AuthContext,
        *,
        block_id: int | None = None,
        location_id: int | None = None,
    ) -> LocationsListDTO:
        query = select(LocationModel).order_by(LocationModel.name)
        if location_id is not None:
            query = query.where(LocationModel.id == location_id)

        if auth.role == "manager":
            managed_block_ids = await manager_block_ids(self.session, UUID(auth.user_id))
            allowed_location_ids = await location_ids_for_blocks(self.session, managed_block_ids)
            if not allowed_location_ids:
                return LocationsListDTO(items=[], total=0)
            query = query.where(LocationModel.id.in_(allowed_location_ids))
        elif block_id is not None:
            block_location_ids = await location_ids_for_blocks(self.session, [block_id])
            if not block_location_ids:
                return LocationsListDTO(items=[], total=0)
            query = query.where(LocationModel.id.in_(block_location_ids))

        locations = (await self.session.execute(query)).scalars().all()
        user_counts = await count_users_by_location(self.session)
        block_info = await _location_block_info(self.session, [loc.id for loc in locations])

        items = []
        for location in locations:
            block = block_info.get(location.id)
            items.append(
                LocationListItemDTO(
                    id=location.id,
                    code=location.code,
                    name=location.name,
                    address=location.address,
                    city=location.city,
                    block_id=block[0] if block else None,
                    block_name=block[1] if block else None,
                    employees=user_counts.get(location.id, 0),
                )
            )
        return LocationsListDTO(items=items, total=len(items))


class GetLocationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, location_id: int, auth: AuthContext) -> Optional[LocationDetailDTO]:
        location = (
            await self.session.execute(select(LocationModel).where(LocationModel.id == location_id))
        ).scalar_one_or_none()
        if location is None:
            return None

        if auth.role == "manager":
            managed_block_ids = await manager_block_ids(self.session, UUID(auth.user_id))
            allowed_location_ids = await location_ids_for_blocks(self.session, managed_block_ids)
            if location_id not in allowed_location_ids:
                return None

        user_counts = await count_users_by_location(self.session)
        block_info = await _location_block_info(self.session, [location.id])
        block = block_info.get(location.id)

        members_result = await self.session.execute(
            select(UserModel)
            .join(UserLocationModel, UserLocationModel.user_id == UserModel.id)
            .where(UserLocationModel.location_id == location_id)
            .order_by(UserModel.last_name, UserModel.first_name)
        )
        members = [_user_brief(user) for user in members_result.scalars().all()]

        return LocationDetailDTO(
            id=location.id,
            code=location.code,
            name=location.name,
            address=location.address,
            city=location.city,
            block_id=block[0] if block else None,
            block_name=block[1] if block else None,
            employees=user_counts.get(location.id, 0),
            members=members,
        )


class CreateLocationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, request: CreateLocationRequest) -> LocationListItemDTO:
        location = LocationModel(
            code=request.code.strip(),
            name=request.name.strip(),
            address=request.address.strip(),
            city=request.city.strip() if request.city else None,
        )
        self.session.add(location)
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Location with this code or name already exists",
            ) from exc
        await self.session.refresh(location)
        return LocationListItemDTO(
            id=location.id,
            code=location.code,
            name=location.name,
            address=location.address,
            city=location.city,
            employees=0,
        )


class UpdateLocationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        location_id: int,
        request: UpdateLocationRequest,
    ) -> Optional[LocationListItemDTO]:
        location = (
            await self.session.execute(select(LocationModel).where(LocationModel.id == location_id))
        ).scalar_one_or_none()
        if location is None:
            return None

        if request.code is not None:
            location.code = request.code.strip()
        if request.name is not None:
            location.name = request.name.strip()
        if request.address is not None:
            location.address = request.address.strip()
        if request.city is not None:
            location.city = request.city.strip() or None

        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Location with this code or name already exists",
            ) from exc
        await self.session.refresh(location)

        user_counts = await count_users_by_location(self.session)
        block_info = await _location_block_info(self.session, [location.id])
        block = block_info.get(location.id)
        return LocationListItemDTO(
            id=location.id,
            code=location.code,
            name=location.name,
            address=location.address,
            city=location.city,
            block_id=block[0] if block else None,
            block_name=block[1] if block else None,
            employees=user_counts.get(location.id, 0),
        )


class DeleteLocationUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, location_id: int) -> bool:
        location = (
            await self.session.execute(select(LocationModel).where(LocationModel.id == location_id))
        ).scalar_one_or_none()
        if location is None:
            return False
        await self.session.delete(location)
        await self.session.commit()
        return True


class AssignLocationToBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, block_id: int, location_id: int) -> LocationListItemDTO:
        block = (
            await self.session.execute(select(BlockModel).where(BlockModel.id == block_id))
        ).scalar_one_or_none()
        location = (
            await self.session.execute(select(LocationModel).where(LocationModel.id == location_id))
        ).scalar_one_or_none()
        if block is None or location is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block or location not found")

        existing = (
            await self.session.execute(
                select(BlockLocationModel).where(BlockLocationModel.location_id == location_id)
            )
        ).scalar_one_or_none()
        if existing is not None and existing.block_id != block_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Location is already assigned to another block",
            )
        if existing is None:
            self.session.add(BlockLocationModel(block_id=block_id, location_id=location_id))
            try:
                await self.session.commit()
            except IntegrityError as exc:
                await self.session.rollback()
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Location is already assigned to another block",
                ) from exc

        user_counts = await count_users_by_location(self.session)
        return LocationListItemDTO(
            id=location.id,
            code=location.code,
            name=location.name,
            address=location.address,
            city=location.city,
            block_id=block_id,
            block_name=block.name,
            employees=user_counts.get(location.id, 0),
        )


class RemoveLocationFromBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, block_id: int, location_id: int) -> bool:
        assignment = (
            await self.session.execute(
                select(BlockLocationModel).where(
                    BlockLocationModel.block_id == block_id,
                    BlockLocationModel.location_id == location_id,
                )
            )
        ).scalar_one_or_none()
        if assignment is None:
            return False
        await self.session.delete(assignment)
        await self.session.commit()
        return True
