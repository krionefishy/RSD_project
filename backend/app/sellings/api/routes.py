from fastapi import APIRouter

router = APIRouter()


@router.get("/stats")
async def get_sales_stats():
    """Get sales statistics."""
    return {"total": 0, "period": "month"}


@router.get("/motivation")
async def get_motivation():
    """Get motivation data."""
    return {"score": 0, "bonus": 0}
