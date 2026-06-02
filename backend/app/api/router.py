from fastapi import APIRouter

from app.admin.api import router as admin_router
from app.auth.api import auth_router
from app.knowledge_base.api import knowledge_base_router
from app.personnel.api import personnel_router
from app.sellings.api import routes as sales_routes
from app.users.api import users_router

api_router = APIRouter()

api_router.get("/health", tags=["health"])(
    lambda: {"status": "ok", "service": "rsd-backend"}
)

api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["auth"],
)
api_router.include_router(
    knowledge_base_router,
    prefix="/kb",
    tags=["knowledge-base"],
)
api_router.include_router(
    users_router,
    prefix="/users",
    tags=["users"],
)
api_router.include_router(
    personnel_router,
    prefix="/personnel",
    tags=["personnel"],
)
api_router.include_router(
    sales_routes.router,
    prefix="/sales",
    tags=["sales"],
)
api_router.include_router(
    admin_router,
    prefix="/admin",
    tags=["admin"],
)
