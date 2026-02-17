from fastapi import APIRouter, Depends

from app.api.dependencies import get_store

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("")
async def list_organizations(store=Depends(get_store)):
    return []
