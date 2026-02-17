from typing import Any

from app.repository.base import BaseAccessor


class ChecklistAccessor(BaseAccessor):
    """Аксессор для чек-листов, шаблонов, категорий, проведённых аудитов."""

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
