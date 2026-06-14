from __future__ import annotations

import json
from typing import Any


class FakeKafkaBroker:
    instances: list[FakeKafkaBroker] = []

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.published: list[tuple[str, Any]] = []
        self.connected: bool = False
        FakeKafkaBroker.instances.append(self)

    async def connect(self) -> None:
        self.connected = True

    async def start(self) -> None:
        self.connected = True

    async def stop(self) -> None:
        self.connected = False

    async def close(self) -> None:
        self.connected = False

    async def publish(self, message: Any, topic: str, *args: Any, **kwargs: Any) -> None:
        self.published.append((topic, message))

    async def send(self, topic: str, value: Any, *args: Any, **kwargs: Any) -> None:
        if isinstance(value, bytes):
            value = json.loads(value.decode("utf-8"))
        self.published.append((topic, value))

    async def publish_batch(self, *messages: Any, topic: str, **kwargs: Any) -> None:
        for message in messages:
            self.published.append((topic, message))

    def subscriber(self, *args: Any, **kwargs: Any):
        def _decorator(func: Any) -> Any:
            return func

        return _decorator

    @property
    def published_events(self) -> list[tuple[str, str, Any]]:
        result = []
        for topic, msg in self.published:
            if isinstance(msg, dict):
                event_type = msg.get("type", "unknown")
                payload = msg.get("payload", msg)
            else:
                event_type = "unknown"
                payload = msg
            result.append((topic, event_type, payload))
        return result

    def clear_published(self) -> None:
        self.published.clear()

    def get_messages_for_topic(self, topic: str) -> list[Any]:
        return [msg for t, msg in self.published if t == topic]

    def was_message_published(self, topic: str, predicate: Any = None) -> bool:
        messages = self.get_messages_for_topic(topic)
        if predicate is None:
            return len(messages) > 0
        return any(predicate(msg) for msg in messages)

    @classmethod
    def clear_all_instances(cls) -> None:
        for instance in cls.instances:
            instance.clear_published()
