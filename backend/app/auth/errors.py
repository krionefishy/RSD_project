from fastapi import HTTPException, status


class AuthError(HTTPException):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_401_UNAUTHORIZED):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message},
        )
        self.code = code
        self.message = message


class InvalidCredentialsError(AuthError):
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__("INVALID_CREDENTIALS", message, status.HTTP_401_UNAUTHORIZED)


class DecryptFailedError(AuthError):
    def __init__(self, message: str = "Failed to decrypt password"):
        super().__init__("DECRYPT_FAILED", message, status.HTTP_400_BAD_REQUEST)


class TokenExpiredError(AuthError):
    def __init__(self, message: str = "Token expired"):
        super().__init__("TOKEN_EXPIRED", message, status.HTTP_401_UNAUTHORIZED)


class TokenInvalidError(AuthError):
    def __init__(self, message: str = "Invalid token"):
        super().__init__("TOKEN_INVALID", message, status.HTTP_401_UNAUTHORIZED)


class RefreshInvalidError(AuthError):
    def __init__(self, message: str = "Refresh token is invalid or has been revoked"):
        super().__init__("REFRESH_INVALID", message, status.HTTP_401_UNAUTHORIZED)


class TokenMissingError(AuthError):
    def __init__(self, message: str = "Authorization token is missing"):
        super().__init__("TOKEN_MISSING", message, status.HTTP_401_UNAUTHORIZED)
