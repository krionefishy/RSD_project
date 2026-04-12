"""Эндпоинты обращаются к store.*_accessor напрямую (без сервисного слоя)."""
from fastapi import APIRouter, Depends, Path

from app.api.dependencies import get_store

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(store=Depends(get_store)):
    return await store.user_accessor.get_all()


@router.get("/{user_id}")
async def get_user(
    user_id: int = Path(..., gt=0),
    store=Depends(get_store),
):
    return await store.user_accessor.get(user_id)
