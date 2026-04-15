from fastapi import APIRouter

router = APIRouter()


@router.get("/dashboard")
async def get_admin_dashboard():
    """Get admin dashboard data."""
    return {"users_count": 0, "courses_count": 0}


@router.post("/users/{user_id}/block")
async def block_user(user_id: str):
    """Block user."""
    return {"user_id": user_id, "blocked": True}
