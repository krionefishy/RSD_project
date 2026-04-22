from uuid import UUID

from pydantic import BaseModel


class UserDTO(BaseModel):
    id: UUID
    email: str
    role: str
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    name: str | None = None
