from fastapi import APIRouter

from app.reports.api import routes

reports_router = APIRouter()
reports_router.include_router(routes.router)

__all__ = ["reports_router"]
