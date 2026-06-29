from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from fastapi import HTTPException, status
from shared.kafka_streams.storage_events import publish_s3_upload, sanitize_key_segment
from shared.kafka_streams.topics import StorageTopics
from sqlalchemy import select

from app.personnel.domain import ALLOWED_AVATAR_CONTENT_TYPES, MAX_AVATAR_BYTES
from app.users.avatar_url import resolve_avatar_url
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError

if TYPE_CHECKING:
    from shared.kafka_streams.producer import KafkaProducerWrapper
    from sqlalchemy.ext.asyncio import AsyncSession
    from storage.s3.client import S3Client

    from app.auth.deps import AuthContext


class UploadOwnAvatarUseCase:
    def __init__(
        self,
        session: AsyncSession,
        kafka_producer: KafkaProducerWrapper,
        s3_client: S3Client | None,
    ):
        self.session = session
        self.kafka_producer = kafka_producer
        self.s3_client = s3_client

    async def execute(
        self,
        ctx: AuthContext,
        filename: str,
        content_type: str,
        payload: bytes,
    ) -> str:
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
            select(UserModel).where(UserModel.id == UUID(ctx.user_id))
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise ProfileNotFoundError()
        if not user.is_active:
            raise ProfileForbiddenError("User account is inactive")

        safe_name = sanitize_key_segment(filename, "avatar")
        key = f"avatars/{user.id}/{safe_name}"
        await publish_s3_upload(
            self.kafka_producer,
            StorageTopics.AVATAR_UPLOAD,
            key=key,
            body=payload,
            content_type=content_type,
            metadata={"user_id": str(user.id)},
            original_filename=filename,
        )
        user.avatar_url = key
        user.updated_at = datetime.now()
        await self.session.commit()
        return resolve_avatar_url(self.s3_client, key) or key
