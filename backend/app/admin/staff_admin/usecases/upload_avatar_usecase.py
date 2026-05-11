from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.db_models import UserModel
from storage.s3.client import S3Client


class UploadAvatarUseCase:
    def __init__(self, session: AsyncSession, s3_client: Optional[S3Client]):
        self.session = session
        self.s3_client = s3_client

    async def execute(
        self,
        user_id,
        filename: str,
        content_type: str,
        payload: bytes,
    ) -> Optional[str]:
        if self.s3_client is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="S3 storage is not configured",
            )

        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            return None

        safe_name = self.s3_client.sanitize_key_segment(filename, "avatar")
        key = f"avatars/{user_id}/{safe_name}"
        await self.s3_client.put_object(
            key=key,
            body=payload,
            content_type=content_type,
            metadata={"user_id": str(user_id)},
        )

        user.avatar_url = key
        user.updated_at = datetime.now(timezone.utc)
        await self.session.commit()

        return key
