from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import AuthContext
from app.personnel.domain import ALLOWED_AVATAR_CONTENT_TYPES, MAX_AVATAR_BYTES
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileForbiddenError, ProfileNotFoundError
from storage.s3.client import S3Client


class UploadOwnAvatarUseCase:
    def __init__(self, session: AsyncSession, s3_client: S3Client | None):
        self.session = session
        self.s3_client = s3_client

    async def execute(
        self,
        ctx: AuthContext,
        filename: str,
        content_type: str,
        payload: bytes,
    ) -> str:
        if self.s3_client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 storage is not configured",
            )
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

        safe_name = self.s3_client.sanitize_key_segment(filename, "avatar")
        key = f"avatars/{user.id}/{safe_name}"
        await self.s3_client.put_object(
            key=key,
            body=payload,
            content_type=content_type,
            metadata={"user_id": str(user.id)},
        )
        user.avatar_url = key
        user.updated_at = datetime.now()
        await self.session.commit()
        return key
