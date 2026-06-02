from fastapi import APIRouter

from app.admin.staff_admin.api import profile_routes
from app.admin.staff_admin.api import routes as legacy_routes
from app.admin.staff_admin.api import timesheet_routes

staff_admin_router = APIRouter()
staff_admin_router.include_router(profile_routes.router)
staff_admin_router.include_router(timesheet_routes.router)
staff_admin_router.include_router(legacy_routes.router)

__all__ = ["staff_admin_router"]
