from typing import Any

from app.repository.base import BaseAccessor


class AdminAccessor(BaseAccessor):
    """Аксессор для функций админки (через вызовы к другим сервисам и при необходимости свои таблицы)."""

    async def get(self, id: int) -> Any | None:
        # TODO: реализовать
        return None

    async def create(self, **kwargs: Any) -> Any:
        # TODO: реализовать
        raise NotImplementedError

    async def update(self, id: int, **kwargs: Any) -> Any | None:
        # TODO: реализовать
        return None

    async def delete(self, id: int) -> bool:
        # TODO: реализовать
        return False
