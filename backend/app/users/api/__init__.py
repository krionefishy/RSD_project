from fastapi import APIRouter

from app.users.api import profile_routes
from app.users.api import routes as user_routes

users_router = APIRouter()
users_router.include_router(profile_routes.router)
users_router.include_router(user_routes.router)

__all__ = ["users_router"]
