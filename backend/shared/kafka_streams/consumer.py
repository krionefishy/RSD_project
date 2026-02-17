import json
import logging
from functools import wraps
from typing import Any, Awaitable, Callable

from aiokafka import AIOKafkaConsumer

from shared.kafka_streams.context import KafkaHandlerContext

logger = logging.getLogger(__name__)


def create_consumer(
    bootstrap_servers: str,
    consumer_group: str,
    topic: str,
) -> AIOKafkaConsumer:
    return AIOKafkaConsumer(
        topic,
        bootstrap_servers=bootstrap_servers,
        group_id=consumer_group,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")) if m else None,
        auto_offset_reset="earliest",
    )


def kafka_subscriber(topic: str) -> Callable[..., Callable[..., Awaitable[None]]]:
    def decorator(
        handler: Callable[[Any, dict], Awaitable[None]],
    ) -> Callable[..., Awaitable[None]]:
        @wraps(handler)
        async def run_consumer(
            bootstrap_servers: str,
            consumer_group: str,
            s3_client: Any,
        ) -> None:
            consumer = create_consumer(bootstrap_servers, consumer_group, topic)
            await consumer.start()
            logger.info("Subscriber started: %s", topic)
            try:
                async for msg in consumer:
                    if msg.value is None:
                        continue
                    try:
                        await handler(s3_client, msg.value)
                        logger.info(
                            "Processed %s partition=%s offset=%s",
                            topic, msg.partition, msg.offset,
                        )
                    except Exception as e:
                        logger.exception(
                            "Failed %s partition=%s offset=%s: %s",
                            topic, msg.partition, msg.offset, e,
                        )
            finally:
                await consumer.stop()
                logger.info("Subscriber stopped: %s", topic)
        return run_consumer
    return decorator


def kafka_domain_subscriber(topic: str) -> Callable[..., Callable[..., Awaitable[None]]]:
    """Подписчик на доменное событие. handler(ctx, payload), ctx.store / ctx.db / ctx.settings."""

    def decorator(
        handler: Callable[[Any, dict], Awaitable[None]],
    ) -> Callable[..., Awaitable[None]]:
        @wraps(handler)
        async def run_consumer(
            bootstrap_servers: str,
            consumer_group: str,
            app: Any,
        ) -> None:
            ctx = KafkaHandlerContext.from_app(app)
            consumer = create_consumer(bootstrap_servers, consumer_group, topic)
            await consumer.start()
            logger.info("Domain subscriber started: %s", topic)
            try:
                async for msg in consumer:
                    if msg.value is None:
                        continue
                    try:
                        await handler(ctx, msg.value)
                        logger.info(
                            "Processed %s partition=%s offset=%s",
                            topic, msg.partition, msg.offset,
                        )
                    except Exception as e:
                        logger.exception(
                            "Failed %s partition=%s offset=%s: %s",
                            topic, msg.partition, msg.offset, e,
                        )
            finally:
                await consumer.stop()
                logger.info("Domain subscriber stopped: %s", topic)
        return run_consumer
    return decorator
