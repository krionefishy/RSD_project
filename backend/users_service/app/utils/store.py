"""Store — контейнер аксессоров. Endpoints обращаются к БД через store.*_accessor (без сервисного слоя)."""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.api.app import Application


class Store:
    def __init__(self, app: "Application"):
        from app.repository.accessors.user_accessor import UserAccessor

        self.user_accessor = UserAccessor(app)


def setup_store(app: "Application") -> None:
    app.store = Store(app)
