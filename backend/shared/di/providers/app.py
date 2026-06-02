from collections.abc import AsyncIterator

from dishka import Provider, Scope, from_context, provide
from sqlalchemy.ext.asyncio import AsyncSession

from shared.kafka_streams.producer import KafkaProducerWrapper
from shared.settings.config import Settings
from storage.pg.database import Database
from storage.redis.client import RedisClient
from storage.s3.client import S3Client


class AppProvider(Provider):
    scope = Scope.APP

    settings = from_context(Settings)
    db = from_context(Database)
    redis = from_context(RedisClient)
    kafka_producer = from_context(KafkaProducerWrapper)
    s3_client = from_context(S3Client)


class SessionProvider(Provider):

    @provide(scope=Scope.REQUEST)
    async def session(self, db: Database) -> AsyncIterator[AsyncSession]:
        session = db.session()
        try:
            yield session
        finally:
            await session.close()
