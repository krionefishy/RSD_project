from dataclasses import dataclass
from typing import Any


@dataclass
class KafkaHandlerContext:
    """Контекст для доменного обработчика Kafka. Явные зависимости, без привязки к FastAPI app."""
    store: Any = None
    db: Any = None
    settings: Any = None

    @classmethod
    def from_app(cls, app: Any) -> "KafkaHandlerContext":
        return cls(
            store=getattr(app.state, "store", None),
            db=getattr(app.state, "db", None),
            settings=getattr(app.state, "settings", None),
        )
