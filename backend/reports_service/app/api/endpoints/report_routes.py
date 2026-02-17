from fastapi import APIRouter, Depends

from app.api.dependencies import get_store

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
async def list_reports(store=Depends(get_store)):
    return []
