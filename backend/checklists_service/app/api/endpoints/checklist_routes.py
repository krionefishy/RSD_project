from fastapi import APIRouter, Depends

from app.api.dependencies import get_store

router = APIRouter(prefix="/checklists", tags=["checklists"])


@router.get("")
async def list_checklists(store=Depends(get_store)):
    # return await store.checklist_accessor.get_all()
    return []
