from pydantic import BaseModel, EmailStr, Field, model_validator
from app.users.db_models import UserRole
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="Email пользователя")
    password: str = Field(..., description="Пароль пользователя")
    role: UserRole = Field(..., description="Роль пользователя")

    @model_validator(mode="after")
    def validate_email(self):
        if not self.email.endswith("@rsd.ru"):
            raise ValueError("Email должен заканчиваться на @rsd.ru")
        if self.role.value == UserRole.SUPER_ADMIN:
            raise ValueError("SuperAdmin не может быть создан")
        if self.role.value == UserRole.ROOT_ADMIN:
            raise ValueError("RootAdmin не может быть создан")
        if self.password is None or len(self.password) < 8:
            raise ValueError("Пароль должен быть не менее 8 символов")
        return self


class User(BaseModel):
    id: UUID = Field(..., description="ID пользователя")
    email: EmailStr = Field(..., description="Email пользователя")
    role: UserRole = Field(..., description="Роль пользователя")
    created_at: datetime = Field(..., description="Дата создания пользователя")