from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.api.app import Application


class Store:
    def __init__(self, app: "Application"):
        from app.repository.accessors.organization_accessor import OrganizationAccessor

        self.organization_accessor = OrganizationAccessor(app)


def setup_store(app: "Application") -> None:
    app.store = Store(app)
