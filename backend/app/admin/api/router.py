from fastapi import APIRouter

from app.admin.educ_admin.api import routes as educ_admin_routes
from app.admin.sales_admin.api import routes as sales_admin_routes
from app.admin.software_admin.api import routes as software_admin_routes
from app.admin.staff_admin.api import routes as staff_admin_routes
from app.admin.super_admin.api import routes as super_admin_routes

router = APIRouter()
router.include_router(software_admin_routes.router, prefix="/software")
router.include_router(staff_admin_routes.router, prefix="/staff")
router.include_router(educ_admin_routes.router, prefix="/education")
router.include_router(sales_admin_routes.router, prefix="/sales")
router.include_router(super_admin_routes.router, prefix="/super")
