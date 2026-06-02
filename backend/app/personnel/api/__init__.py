from fastapi import APIRouter

from app.personnel.api import routes

personnel_router = APIRouter()
personnel_router.include_router(routes.router)

__all__ = ["personnel_router"]
