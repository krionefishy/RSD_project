import asyncio
import logging
from typing import TYPE_CHECKING

from aiokafka import AIOKafkaProducer

from shared.kafka_streams.producer import KafkaProducerWrapper

if TYPE_CHECKING:
    from fastapi import FastAPI

logger = logging.getLogger("main")


async def start_kafka(
    app: "FastAPI",
    bootstrap_servers: str,
    consumer_group: str,
    max_request_size: int = 10 * 1024 * 1024,
    s3_client=None,
    consumers: list | None = None,
) -> None:
    try:
        raw = AIOKafkaProducer(
            bootstrap_servers=bootstrap_servers,
            max_request_size=max_request_size,
        )
        await raw.start()
        app.state.kafka_producer = KafkaProducerWrapper(raw)
        logger.info("Kafka producer started")
    except Exception as e:
        logger.warning("Kafka producer not started: %s", e)
        app.state.kafka_producer = KafkaProducerWrapper(None)

    tasks = []
    for run_consumer in consumers or []:
        try:
            task = asyncio.create_task(
                run_consumer(
                    bootstrap_servers=bootstrap_servers,
                    consumer_group=consumer_group,
                    s3_client=s3_client,
                ),
            )
            tasks.append(task)
        except Exception as e:
            logger.warning("Kafka subscriber %s not started: %s", getattr(run_consumer, "__name__", ""), e)

    app.state._kafka_consumer_tasks = tasks
    if tasks:
        logger.info("Kafka consumers started: %d tasks", len(tasks))


async def stop_kafka(app: "FastAPI") -> None:
    tasks = getattr(app.state, "_kafka_consumer_tasks", []) or []
    for task in tasks:
        if not task.done():
            task.cancel()
    for task in tasks:
        try:
            await task
        except asyncio.CancelledError:
            pass
    if tasks:
        logger.info("Kafka consumer tasks stopped: %d", len(tasks))

    producer = getattr(app.state, "kafka_producer", None)
    if producer is not None:
        await producer.stop()
    logger.info("Kafka producer stopped")
