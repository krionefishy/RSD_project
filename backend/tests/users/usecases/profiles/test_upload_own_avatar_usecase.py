from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from shared.kafka_streams.topics import StorageTopics
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.personnel.domain import MAX_AVATAR_BYTES
from app.users.db_models import UserModel
from app.users.profile_errors import ProfileForbiddenError
from app.users.usecases.profiles.upload_own_avatar_usecase import UploadOwnAvatarUseCase
from tests.builder import Builder
from tests.mocks import FakeKafkaBroker


def _make_s3_client() -> MagicMock:
    s3 = MagicMock()
    s3.generate_presigned_url.side_effect = (
        lambda key, expiration=3600, response_content_type=None, response_disposition=None: (
            f"https://s3.example.com/{key}?sig=test"
        )
    )
    return s3


class TestUploadOwnAvatarUseCase:
    async def test_uploads_avatar_and_updates_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)
        payload = b"\xff\xd8\xff\xe0" + b"\x00" * 100

        kafka = FakeKafkaBroker()
        s3 = _make_s3_client()
        url = await UploadOwnAvatarUseCase(db_session, kafka, s3).execute(
            ctx,
            filename="avatar.jpg",
            content_type="image/jpeg",
            payload=payload,
        )

        key = f"avatars/{seller.id}/avatar.jpg"
        assert url == f"https://s3.example.com/{key}?sig=test"
        assert kafka.was_message_published(
            StorageTopics.AVATAR_UPLOAD,
            lambda msg: msg["key"] == key and msg["content_type"] == "image/jpeg",
        )
        row = await db_session.execute(select(UserModel).where(UserModel.id == seller.id))
        updated = row.scalar_one()
        assert updated.avatar_url == key

    async def test_raises_for_inactive_user(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.build_user(
            external_system_id="inactive_avatar_user",
            is_active=False,
        )
        ctx = builder.auth_context_for(seller)

        with pytest.raises(ProfileForbiddenError):
            await UploadOwnAvatarUseCase(db_session, FakeKafkaBroker(), None).execute(
                ctx,
                filename="avatar.jpg",
                content_type="image/jpeg",
                payload=b"data",
            )

    async def test_raises_for_unsupported_content_type(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        with pytest.raises(HTTPException) as exc_info:
            await UploadOwnAvatarUseCase(db_session, FakeKafkaBroker(), None).execute(
                ctx,
                filename="avatar.gif",
                content_type="image/gif",
                payload=b"gif-data",
            )

        assert exc_info.value.status_code == 422

    async def test_raises_when_file_exceeds_size_limit(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        with pytest.raises(HTTPException) as exc_info:
            await UploadOwnAvatarUseCase(db_session, FakeKafkaBroker(), None).execute(
                ctx,
                filename="avatar.jpg",
                content_type="image/jpeg",
                payload=b"x" * (MAX_AVATAR_BYTES + 1),
            )

        assert exc_info.value.status_code == 422

    async def test_raises_for_empty_file(
        self,
        db_session: AsyncSession,
        builder: Builder,
    ) -> None:
        seller = await builder.default_seller
        ctx = builder.auth_context_for(seller)

        with pytest.raises(HTTPException) as exc_info:
            await UploadOwnAvatarUseCase(db_session, FakeKafkaBroker(), None).execute(
                ctx,
                filename="avatar.png",
                content_type="image/png",
                payload=b"",
            )

        assert exc_info.value.status_code == 422
