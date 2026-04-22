from pydantic import BaseModel, EmailStr, Field, model_validator


class LoginRequest(BaseModel):
    email: EmailStr
    encrypted_password: str = Field(min_length=1)

    @model_validator(mode="after")
    def _validate(self) -> "LoginRequest":
        self.email = self.email.strip().lower()
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
