from fastapi import APIRouter

from app.auth.api import routes as auth_routes

auth_router = APIRouter()
auth_router.include_router(auth_routes.router)
