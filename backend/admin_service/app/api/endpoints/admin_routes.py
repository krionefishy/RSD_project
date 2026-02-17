from fastapi import APIRouter, Depends

from app.api.dependencies import get_store

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("")
async def admin_info(store=Depends(get_store)):
    return {"service": "admin"}
