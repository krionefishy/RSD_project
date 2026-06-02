from uuid import UUID

from pydantic import BaseModel


class PublicKeyDTO(BaseModel):
    public_key_pem: str


class TokenPairDTO(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: UUID
    role: str
