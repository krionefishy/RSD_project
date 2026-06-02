from fastapi import HTTPException, status


class ProfileNotFoundError(HTTPException):
    def __init__(self, message: str = "User not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=message)


class ProfileForbiddenError(HTTPException):
    def __init__(self, message: str = "Access denied"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=message)


class ProfileConflictError(HTTPException):
    def __init__(self, message: str = "Conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=message)
