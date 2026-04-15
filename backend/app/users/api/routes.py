from fastapi import APIRouter

router = APIRouter()


@router.get("/me")
async def get_current_user():
    """Get current user profile."""
    return {"id": "placeholder", "name": "User"}


@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get user by ID."""
    return {"id": user_id, "name": "User"}
