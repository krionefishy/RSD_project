from fastapi import APIRouter

from app.sales.api import sales_router

api_router = APIRouter()

api_router.get("/health", tags=["health"])(
    lambda: {"status": "ok", "service": "rsd-cash-ingestion-service"}
)
api_router.include_router(
    sales_router,
    prefix="/sales",
    tags=["sales"],
)
