from fastapi import APIRouter

from app.admin.api import router as admin_router
from app.auth.api import auth_router
from app.knowledge_base.api import knowledge_base_router
from app.sellings.api import routes as sellings_routes
from app.users.api import routes as users_routes

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
    users_routes.router,
    prefix="/users",
    tags=["users"],
)
api_router.include_router(
    sellings_routes.router,
    prefix="/sellings",
    tags=["sellings"],
)
api_router.include_router(
    admin_router,
    prefix="/admin",
    tags=["admin"],
)
