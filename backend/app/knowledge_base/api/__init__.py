from fastapi import APIRouter

from app.knowledge_base.api.courses import routes as courses_routes
from app.knowledge_base.api.materials import routes as materials_routes
from app.knowledge_base.api.tests import routes as tests_routes
from app.knowledge_base.api.user_courses import routes as user_courses_routes

knowledge_base_router = APIRouter()

knowledge_base_router.include_router(
    courses_routes.router,
    prefix="/courses",
    tags=["courses"],
)
knowledge_base_router.include_router(
    materials_routes.router,
    prefix="/materials",
    tags=["materials"],
)
knowledge_base_router.include_router(
    tests_routes.router,
    prefix="/tests",
    tags=["tests"],
)
knowledge_base_router.include_router(
    user_courses_routes.router,
    prefix="/user-courses",
    tags=["user-courses"],
)
