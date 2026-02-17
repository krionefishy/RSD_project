import logging
from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class BaseAccessor(ABC):
    """Абстрактный базовый класс для аксессоров к БД.
    Endpoints обращаются к БД через аксессоры. 
    У каждого дочернего аксессора обязательны методы ниже."""

    def __init__(self, app: Any):
        self.app = app
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    async def get(self, id: int) -> Any | None:
        """Получить сущность по id."""
        ...

    @abstractmethod
    async def create(self, **kwargs: Any) -> Any:
        """Создать сущность."""
        ...

    @abstractmethod
    async def update(self, id: int, **kwargs: Any) -> Any | None:
        """Обновить сущность по id."""
        ...

    @abstractmethod
    async def delete(self, id: int) -> bool:
        """Удалить сущность по id. Возвращает True, если удалено."""
        ...
