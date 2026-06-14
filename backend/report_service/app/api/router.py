from fastapi import APIRouter

from app.reports.api import reports_router

api_router = APIRouter()

api_router.get("/health", tags=["health"])(
    lambda: {"status": "ok", "service": "rsd-report-service"}
)
api_router.include_router(
    reports_router,
    prefix="/reports",
    tags=["reports"],
)
