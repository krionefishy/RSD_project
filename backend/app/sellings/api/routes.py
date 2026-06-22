from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get(
    "/stats",
    include_in_schema=False,
)
async def get_sales_stats():
    return JSONResponse(
        status_code=501,
        content={"detail": "Sales statistics are not yet implemented."},
    )


@router.get(
    "/motivation",
    include_in_schema=False,
)
async def get_motivation():
    return JSONResponse(
        status_code=501,
        content={"detail": "Sales motivation is not yet implemented."},
    )
