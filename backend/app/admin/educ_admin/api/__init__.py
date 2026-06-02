from fastapi import APIRouter

from app.admin.educ_admin.api import courses_routes, materials_routes, test_tasks_routes, tests_routes

router = APIRouter()
router.include_router(courses_routes.router, prefix="/courses")
router.include_router(materials_routes.router, prefix="/materials")
router.include_router(tests_routes.router, prefix="/tests")
router.include_router(test_tasks_routes.router, prefix="/test-tasks")
