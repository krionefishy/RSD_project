from uuid import UUID

from pydantic import BaseModel, Field

from app.users.dto import UserBriefDTO


class BlockListItemDTO(BaseModel):
    id: int
    name: str
    description: str | None = None
    stores: int = 0
    employees: int = 0
    manager_id: UUID | None = None
    manager_name: str | None = None


class LocationBriefInBlockDTO(BaseModel):
    id: int
    code: str
    name: str
    address: str
    city: str | None = None
    employees: int = 0


class BlockDetailDTO(BlockListItemDTO):
    locations: list[LocationBriefInBlockDTO] = Field(default_factory=list)
    members: list[UserBriefDTO] = Field(default_factory=list)


class LocationListItemDTO(BaseModel):
    id: int
    code: str
    name: str
    address: str
    city: str | None = None
    s1_start_at: str | None = None
    s1_end_at: str | None = None
    s2_start_at: str | None = None
    s2_end_at: str | None = None
    block_id: int | None = None
    block_name: str | None = None
    employees: int = 0


class LocationDetailDTO(LocationListItemDTO):
    members: list[UserBriefDTO] = Field(default_factory=list)


class BlocksListDTO(BaseModel):
    items: list[BlockListItemDTO]
    total: int


class LocationsListDTO(BaseModel):
    items: list[LocationListItemDTO]
    total: int
