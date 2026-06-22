from datetime import UTC, datetime

from fastapi import HTTPException, status
from shared.kafka_streams.producer import KafkaProducerWrapper
from shared.kafka_streams.storage_events import publish_s3_upload, sanitize_key_segment
from shared.kafka_streams.topics import StorageTopics
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.domain import ALLOWED_AVATAR_CONTENT_TYPES, MAX_AVATAR_BYTES
from app.users.db_models import UserModel
from app.users.profile_scope import ensure_staff_admin_can_manage_user


class UploadAvatarUseCase:
    def __init__(self, session: AsyncSession, kafka_producer: KafkaProducerWrapper):
        self.session = session
        self.kafka_producer = kafka_producer

    async def execute(
        self,
        user_id,
        filename: str,
        content_type: str,
        payload: bytes,
        ctx: AuthContext,
    ) -> str | None:
        if content_type not in ALLOWED_AVATAR_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unsupported image type",
            )
        if len(payload) > MAX_AVATAR_BYTES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="File is too large",
            )
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Empty file",
            )

        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None

        ensure_staff_admin_can_manage_user(ctx, user.role)

        safe_name = sanitize_key_segment(filename, "avatar")
        key = f"avatars/{user_id}/{safe_name}"

        user.avatar_url = key
        user.updated_at = datetime.now(UTC)
        await self.session.commit()

        # Publish Kafka event after DB commit so the avatar_url is persisted
        # before the S3 upload is triggered. If Kafka is unavailable the
        # avatar_url stays in DB but the file won't be uploaded until the next
        # publish attempt (best-effort; full transactional outbox is a follow-up).
        await publish_s3_upload(
            self.kafka_producer,
            StorageTopics.AVATAR_UPLOAD,
            key=key,
            body=payload,
            content_type=content_type,
            metadata={"user_id": str(user_id)},
            original_filename=filename,
        )

        return key
