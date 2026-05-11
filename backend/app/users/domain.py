from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.locations.db_models import BlockMemberStatus
from app.users.db_models import UserRole

class UserCreate(BaseModel):
    external_system_id: str = Field(..., min_length=1, max_length=255, description="ID пользователя во внешней системе")
    password: str | None = Field(None, description="Пароль пользователя")
    encrypted_password: str | None = Field(None, description="RSA-OAEP пароль пользователя")
    role: UserRole = Field(..., description="Роль пользователя")
    first_name: str | None = Field(None, description="Имя")
    last_name: str | None = Field(None, description="Фамилия")
    phone: str | None = Field(None, description="Телефон")
    position: str | None = Field(None, description="Должность")

    @model_validator(mode="after")
    def validate_user_create(self):
        self.external_system_id = self.external_system_id.strip()
        if not self.external_system_id:
            raise ValueError("external_system_id не может быть пустым")
        if self.role == UserRole.SUPER_ADMIN:
            raise ValueError("SuperAdmin не может быть создан")
        if self.role == UserRole.ROOT_ADMIN:
            raise ValueError("RootAdmin не может быть создан")
        if not self.password and not self.encrypted_password:
            raise ValueError("Пароль должен быть задан")
        if self.password is not None and len(self.password) < 8:
            raise ValueError("Пароль должен быть не менее 8 символов")
        return self


class UserAdminUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    position: str | None = None
    location_id: int | None = None
    block_member_status: str | None = None

    @model_validator(mode="after")
    def validate_status(self):
        if self.block_member_status is None:
            return self
        status = self.block_member_status.strip().lower()
        allowed = {BlockMemberStatus.PRIMARY.value, BlockMemberStatus.RESERVE.value}
        if status not in allowed:
            raise ValueError("block_member_status должен быть primary или reserve")
        self.block_member_status = status
        return self


class UserBlockRequest(BaseModel):
    block_id: int


class UserLocationRequest(BaseModel):
    location_id: int


class ManagerBlockAssignRequest(BaseModel):
    block_id: int


class User(BaseModel):
    id: UUID = Field(..., description="ID пользователя")
    external_system_id: str = Field(..., description="ID пользователя во внешней системе")
    role: UserRole = Field(..., description="Роль пользователя")
    created_at: datetime = Field(..., description="Дата создания пользователя")