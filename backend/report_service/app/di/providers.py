from collections.abc import AsyncIterator

from dishka import Provider, Scope, from_context, provide
from dishka.integrations.fastapi import FastapiProvider
from shared.kafka_streams.producer import KafkaProducerWrapper
from shared.settings.config import Settings
from sqlalchemy.ext.asyncio import AsyncSession
from storage.pg.database import Database
from storage.pg.main_replica import MainReplicaDatabase
from storage.redis.client import RedisClient
from storage.s3.client import S3Client

from app.reports.usecases.parse_report_usecase import ParseReportUseCase
from app.reports.usecases.parse_timesheet_schedule_usecase import (
    ParseTimesheetScheduleUseCase,
)


class AppProvider(Provider):
    scope = Scope.APP

    settings = from_context(Settings)
    db = from_context(Database)
    main_replica_db = from_context(MainReplicaDatabase)
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


class ReportsUsecaseProvider(Provider):
    scope = Scope.REQUEST

    parse_report = provide(ParseReportUseCase)
    parse_timesheet_schedule = provide(ParseTimesheetScheduleUseCase)


ALL_PROVIDERS = [
    AppProvider(),
    SessionProvider(),
    FastapiProvider(),
    ReportsUsecaseProvider(),
]
