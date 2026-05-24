from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from app.admin.super_admin.domain import CreateBlockRequest, UpdateBlockRequest
from app.auth.deps import AuthContext
from app.locations.db_models import BlockLocationModel, BlockMemberModel, BlockModel, LocationModel
from app.locations.structure_dto import (
    BlockDetailDTO,
    BlockListItemDTO,
    BlocksListDTO,
    LocationBriefInBlockDTO,
)
from app.locations.structure_queries import (
    count_locations_by_block,
    count_members_by_block,
    count_users_by_location,
    location_ids_for_blocks,
    manager_block_ids,
    managers_by_block,
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


class ListBlocksUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        auth: AuthContext,
        *,
        block_id: int | None = None,
    ) -> BlocksListDTO:
        query = select(BlockModel).order_by(BlockModel.name)
        if block_id is not None:
            query = query.where(BlockModel.id == block_id)
        elif auth.role == "manager":
            managed_ids = await manager_block_ids(self.session, UUID(auth.user_id))
            if not managed_ids:
                return BlocksListDTO(items=[], total=0)
            query = query.where(BlockModel.id.in_(managed_ids))

        blocks = (await self.session.execute(query)).scalars().all()
        location_counts = await count_locations_by_block(self.session)
        member_counts = await count_members_by_block(self.session)
        block_managers = await managers_by_block(self.session)

        items = []
        for block in blocks:
            manager = block_managers.get(block.id)
            items.append(
                BlockListItemDTO(
                    id=block.id,
                    name=block.name,
                    description=block.description,
                    stores=location_counts.get(block.id, 0),
                    employees=member_counts.get(block.id, 0),
                    manager_id=manager[0] if manager else None,
                    manager_name=manager[1] if manager else None,
                )
            )
        return BlocksListDTO(items=items, total=len(items))


class GetBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, block_id: int, auth: AuthContext) -> Optional[BlockDetailDTO]:
        if auth.role == "manager":
            managed_ids = await manager_block_ids(self.session, UUID(auth.user_id))
            if block_id not in managed_ids:
                return None

        block = (
            await self.session.execute(select(BlockModel).where(BlockModel.id == block_id))
        ).scalar_one_or_none()
        if block is None:
            return None

        location_counts = await count_locations_by_block(self.session)
        member_counts = await count_members_by_block(self.session)
        user_counts = await count_users_by_location(self.session)
        block_managers = await managers_by_block(self.session)

        locations_result = await self.session.execute(
            select(LocationModel)
            .join(BlockLocationModel, BlockLocationModel.location_id == LocationModel.id)
            .where(BlockLocationModel.block_id == block_id)
            .order_by(LocationModel.name)
        )
        locations = [
            LocationBriefInBlockDTO(
                id=location.id,
                code=location.code,
                name=location.name,
                address=location.address,
                city=location.city,
                employees=user_counts.get(location.id, 0),
            )
            for location in locations_result.scalars().all()
        ]

        members_result = await self.session.execute(
            select(UserModel)
            .join(BlockMemberModel, BlockMemberModel.user_id == UserModel.id)
            .where(BlockMemberModel.block_id == block_id)
            .order_by(UserModel.last_name, UserModel.first_name)
        )
        members = [_user_brief(user) for user in members_result.scalars().all()]

        manager = block_managers.get(block.id)
        return BlockDetailDTO(
            id=block.id,
            name=block.name,
            description=block.description,
            stores=location_counts.get(block.id, 0),
            employees=member_counts.get(block.id, 0),
            manager_id=manager[0] if manager else None,
            manager_name=manager[1] if manager else None,
            locations=locations,
            members=members,
        )


class CreateBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, request: CreateBlockRequest) -> BlockListItemDTO:
        block = BlockModel(name=request.name.strip(), description=request.description)
        self.session.add(block)
        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Block with this name already exists",
            ) from exc
        await self.session.refresh(block)
        return BlockListItemDTO(
            id=block.id,
            name=block.name,
            description=block.description,
            stores=0,
            employees=0,
        )


class UpdateBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, block_id: int, request: UpdateBlockRequest) -> Optional[BlockListItemDTO]:
        block = (
            await self.session.execute(select(BlockModel).where(BlockModel.id == block_id))
        ).scalar_one_or_none()
        if block is None:
            return None

        if request.name is not None:
            block.name = request.name.strip()
        if request.description is not None:
            block.description = request.description

        try:
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Block with this name already exists",
            ) from exc
        await self.session.refresh(block)

        location_counts = await count_locations_by_block(self.session)
        member_counts = await count_members_by_block(self.session)
        block_managers = await managers_by_block(self.session)
        manager = block_managers.get(block.id)
        return BlockListItemDTO(
            id=block.id,
            name=block.name,
            description=block.description,
            stores=location_counts.get(block.id, 0),
            employees=member_counts.get(block.id, 0),
            manager_id=manager[0] if manager else None,
            manager_name=manager[1] if manager else None,
        )


class DeleteBlockUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, block_id: int) -> bool:
        block = (
            await self.session.execute(select(BlockModel).where(BlockModel.id == block_id))
        ).scalar_one_or_none()
        if block is None:
            return False
        await self.session.delete(block)
        await self.session.commit()
        return True
