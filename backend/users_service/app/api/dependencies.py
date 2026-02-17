"""Endpoints получают сессию БД и store (аксессоры), без сервисного слоя."""
from fastapi import Request
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.utils.store import Store


async def get_db_session(request: Request):
    session = request.app.state.db.session()
    try:
        yield session
    finally:
        await session.close()


def get_store(request: Request) -> "Store":
    return request.app.state.store
