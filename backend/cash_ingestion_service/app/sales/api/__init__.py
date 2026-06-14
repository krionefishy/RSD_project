from fastapi import APIRouter

from app.sales.api import routes

sales_router = APIRouter()
sales_router.include_router(routes.router)

__all__ = ["sales_router"]
