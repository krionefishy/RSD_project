import json
from typing import Any, Optional

from fastapi import Request


class KafkaProducerWrapper:
    """Обёртка над AIOKafkaProducer. Получается через Depends(get_producer), отправка: await producer.send(topic, payload)."""

    def __init__(self, producer: Any = None):
        self._producer = producer

    async def send(self, topic: str, payload: dict) -> Any:
        if self._producer is None:
            return None
        return await self._producer.send(
            topic,
            value=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        )

    async def stop(self) -> None:
        if self._producer is not None:
            await self._producer.stop()
            self._producer = None


def get_producer(request: Request) -> KafkaProducerWrapper:
    return getattr(request.app.state, "kafka_producer", None) or KafkaProducerWrapper(None)
