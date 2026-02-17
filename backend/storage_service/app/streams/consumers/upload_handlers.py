"""
Обработчики StorageTopics: получают payload с key и content_base64, загружают в S3.
"""
import base64
import logging

from shared.kafka_streams.consumer import kafka_subscriber
from shared.kafka_streams.topics import StorageTopics

logger = logging.getLogger(__name__)


def _upload(s3_client, payload: dict) -> None:
    key = payload.get("key")
    content_base64 = payload.get("content_base64")
    if not key:
        raise ValueError("payload missing 'key'")
    if content_base64 is None:
        raise ValueError("payload missing 'content_base64'")
    body = base64.b64decode(content_base64)
    content_type = payload.get("content_type") or "application/octet-stream"
    s3_client.put_object_raw(key, body, content_type=content_type)


@kafka_subscriber(StorageTopics.REPORT)
async def handle_report(s3_client, payload: dict) -> None:
    _upload(s3_client, payload)


@kafka_subscriber(StorageTopics.CHECKLIST_REPORT)
async def handle_checklist_report(s3_client, payload: dict) -> None:
    _upload(s3_client, payload)


@kafka_subscriber(StorageTopics.AUDIT_REPORT)
async def handle_audit_report(s3_client, payload: dict) -> None:
    _upload(s3_client, payload)
