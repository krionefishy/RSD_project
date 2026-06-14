import base64
import unicodedata

from pydantic import BaseModel, Field

from shared.kafka_streams.producer import KafkaProducerWrapper


class S3UploadEvent(BaseModel):
    key: str = Field(min_length=1, max_length=500)
    content_base64: str = Field(min_length=1)
    content_type: str = "application/octet-stream"
    metadata: dict[str, str] = Field(default_factory=dict)
    original_filename: str | None = None


class S3DeleteEvent(BaseModel):
    key: str = Field(min_length=1, max_length=500)
    metadata: dict[str, str] = Field(default_factory=dict)


def sanitize_key_segment(value: str | None, fallback: str) -> str:
    if not value:
        return fallback
    normalized = unicodedata.normalize("NFKD", value).strip()
    if not normalized:
        return fallback
    allowed_chars = {"_", "-", "."}
    cleaned = []
    for ch in normalized:
        if ch.isalnum() or ch in allowed_chars:
            cleaned.append(ch)
        else:
            cleaned.append("_")
    result = "".join(cleaned).strip("._-")
    return result if result else fallback


async def publish_s3_upload(
    kafka_producer: KafkaProducerWrapper,
    topic: str,
    *,
    key: str,
    body: bytes,
    content_type: str,
    metadata: dict[str, str] | None = None,
    original_filename: str | None = None,
) -> None:
    event = S3UploadEvent(
        key=key,
        content_base64=base64.b64encode(body).decode("ascii"),
        content_type=content_type,
        metadata=metadata or {},
        original_filename=original_filename,
    )
    await kafka_producer.send(topic, event.model_dump(exclude_none=True))


async def publish_s3_delete(
    kafka_producer: KafkaProducerWrapper,
    topic: str,
    *,
    key: str,
    metadata: dict[str, str] | None = None,
) -> None:
    event = S3DeleteEvent(key=key, metadata=metadata or {})
    await kafka_producer.send(topic, event.model_dump())
