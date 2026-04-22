import logging
from typing import List
from uuid import UUID

from shared.settings.config import Settings
from storage.redis.client import RedisClient

logger = logging.getLogger("auth.redis_store")


class RefreshTokenStore:
    def __init__(self, redis: RedisClient, settings: Settings):
        self._redis = redis
        self._ttl = settings.jwt.refresh_expire_seconds

    @staticmethod
    def _key(user_id: UUID, jti: str) -> str:
        return f"refresh:{user_id}:{jti}"

    @staticmethod
    def _pattern(user_id: UUID) -> str:
        return f"refresh:{user_id}:*"

    async def save(self, user_id: UUID, jti: str) -> None:
        await self._redis.set(self._key(user_id, jti), "1", expire=self._ttl)

    async def exists(self, user_id: UUID, jti: str) -> bool:
        return await self._redis.exists(self._key(user_id, jti))

    async def delete(self, user_id: UUID, jti: str) -> None:
        await self._redis.delete(self._key(user_id, jti))

    async def delete_all_for_user(self, user_id: UUID) -> int:
        client = self._redis._client  # type: ignore[attr-defined]
        if client is None:
            return 0
        deleted = 0
        keys: List[str] = []
        async for key in client.scan_iter(match=self._pattern(user_id)):
            keys.append(key)
            if len(keys) >= 100:
                deleted += await client.delete(*keys)
                keys.clear()
        if keys:
            deleted += await client.delete(*keys)
        if deleted:
            logger.warning("Invalidated %d refresh tokens for user %s", deleted, user_id)
        return deleted
