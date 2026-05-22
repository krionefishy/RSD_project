from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class LocationBriefDTO(BaseModel):
    id: int
    name: str


class BlockBriefDTO(BaseModel):
    id: int
    name: str


class UserDTO(BaseModel):
    id: UUID
    external_system_id: str
    role: str
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    name: str | None = None
    position: str | None = None
    avatar_url: str | None = None
    is_active: bool | None = None
    is_temp_password: bool | None = None
    birth_date: date | None = None
    location: LocationBriefDTO | None = None
    managed_block: BlockBriefDTO | None = None


class UsersListDTO(BaseModel):
    items: list[UserDTO]
    total: int


class UserCreateResultDTO(BaseModel):
    user: UserDTO
    temp_password: str


class ManagerBlockDTO(BaseModel):
    id: int
    manager_id: UUID
    block_id: int
    assigned_at: datetime


class UserLocationDTO(BaseModel):
    id: int
    user_id: UUID
    location_id: int
    assigned_at: datetime


class AvatarUploadResultDTO(BaseModel):
    avatar_url: str


class TempPasswordDTO(BaseModel):
    temp_password: str
