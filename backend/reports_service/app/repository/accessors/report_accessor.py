from typing import Any

from app.repository.base import BaseAccessor


class ReportAccessor(BaseAccessor):
    """Аксессор для отчётов по аудитам, выгрузки xlsx/pdf."""

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
