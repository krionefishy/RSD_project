from fastapi import APIRouter

from app.admin.api import routes as admin_routes
from app.knowledge_base.api.courses import routes as courses_routes
from app.knowledge_base.api.materials import routes as materials_routes
from app.knowledge_base.api.tests import routes as tests_routes
from app.sellings.api import routes as sellings_routes
from app.users.api import routes as users_routes

api_router = APIRouter()

api_router.get("/health", tags=["health"])(
    lambda: {"status": "ok", "service": "rsd-backend"}
)

api_router.include_router(tests_routes.router, prefix="/tests", tags=["tests"])
api_router.include_router(materials_routes.router, prefix="/materials", tags=["materials"])
api_router.include_router(courses_routes.router, prefix="/courses", tags=["courses"])
api_router.include_router(users_routes.router, prefix="/users", tags=["users"])
api_router.include_router(sellings_routes.router, prefix="/sellings", tags=["sellings"])
api_router.include_router(admin_routes.router, prefix="/admin", tags=["admin"])
