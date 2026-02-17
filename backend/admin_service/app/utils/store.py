from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.api.app import Application


class Store:
    def __init__(self, app: "Application"):
        from app.repository.accessors.admin_accessor import AdminAccessor

        self.admin_accessor = AdminAccessor(app)


def setup_store(app: "Application") -> None:
    app.store = Store(app)
