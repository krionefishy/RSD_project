from pydantic import BaseModel, Field, model_validator


class LoginRequest(BaseModel):
    external_system_id: str = Field(min_length=1, max_length=255)
    encrypted_password: str = Field(min_length=1)

    @model_validator(mode="after")
    def _validate(self) -> "LoginRequest":
        self.external_system_id = self.external_system_id.strip()
        if not self.external_system_id:
            raise ValueError("external_system_id must not be empty")
        if not self.encrypted_password.strip():
            raise ValueError("encrypted_password must not be empty")
        return self


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)

    @model_validator(mode="after")
    def _validate(self) -> "RefreshRequest":
        if not self.refresh_token.strip():
            raise ValueError("refresh_token must not be empty")
        return self


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=1)

    @model_validator(mode="after")
    def _validate(self) -> "LogoutRequest":
        if not self.refresh_token.strip():
            raise ValueError("refresh_token must not be empty")
        return self
