import logging
import os
from contextlib import asynccontextmanager

from dishka import make_async_container
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from shared.di.providers import ALL_PROVIDERS
from shared.kafka_streams.kafka import start_kafka, stop_kafka
from shared.kafka_streams.producer import KafkaProducerWrapper
from shared.kafka_streams.subscribers import s3_consumers
from shared.settings.config import Settings, load_settings
from storage.pg.database import Database
from storage.redis.client import RedisClient
from storage.s3.client import S3Client


class Application:

    def __init__(self):
        self.app: FastAPI = FastAPI(
            title="RSD Backend",
            version="1.0.0",
            lifespan=self.lifespan,
        )
        self.db: Database = Database()
        config_path = os.getenv("CONFIG_PATH", "shared/settings/config.yaml")
        self.settings: Settings = load_settings(config_path)
        self.redis_client = RedisClient(
            host=self.settings.redis.host,
            port=self.settings.redis.port,
            db=self.settings.redis.db,
        )
        self.s3_client: S3Client | None = None
        self.kafka_producer = KafkaProducerWrapper(None)

        self._setup_logging()
        self._init_s3_client()

        container = make_async_container(
            *ALL_PROVIDERS,
            context={
                Settings: self.settings,
                Database: self.db,
                RedisClient: self.redis_client,
                KafkaProducerWrapper: self.kafka_producer,
                S3Client: self.s3_client,
            },
        )
        self.container = container
        setup_dishka(container, self.app)

        self._setup_routes()
        self._setup_middleware()

    def _setup_middleware(self):
        cors_origins = self._get_cors_origins()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _get_cors_origins(self) -> list[str]:
        raw = os.getenv("CORS_ORIGINS", "*").strip()
        if not raw or raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    def _setup_routes(self):
        self.app.include_router(api_router, prefix="/api/v1")

    def _init_s3_client(self) -> None:
        if not self.settings.s3:
            return
        try:
            self.s3_client = S3Client(
                endpoint_url=self.settings.s3.endpoint_url,
                key_id=self.settings.s3.key_id,
                secret_key=self.settings.s3.secret_key,
                bucket_name=self.settings.s3.bucket_name,
                tenant_id=self.settings.s3.tenant_id,
                region=self.settings.s3.region,
                verify=self.settings.s3.verify,
            )
        except Exception as e:
            logging.getLogger("main").warning("S3 not available: %s", e)

    async def _on_startup(self):
        logger = logging.getLogger("main")
        logger.info("RSD Backend starting...")

        await self.db.connect(
            db_url=self.settings.database.url,
            echo=self.settings.database.echo,
        )
        logger.info("Database connected")

        await self.redis_client.connect()
        logger.info("Redis connected")

        if self.s3_client is not None:
            logger.info("S3 client initialized")

        try:
            await start_kafka(
                app=self.app,
                bootstrap_servers=self.settings.kafka.bootstrap_servers,
                consumer_group=self.settings.kafka.consumer_group,
                max_request_size=self.settings.kafka.max_request_size,
                s3_client=self.s3_client,
                consumers=s3_consumers,
                kafka_producer=self.kafka_producer,
            )
            logger.info("Kafka started")
        except Exception as exc:
            logger.warning("Kafka unavailable, continuing without it: %s", exc)
        logger.info("RSD Backend started successfully")

    async def _on_shutdown(self):
        logger = logging.getLogger("main")
        logger.info("RSD Backend shutting down...")

        await stop_kafka(self.app)

        await self.container.close()

        if self.redis_client:
            await self.redis_client.disconnect()

        await self.db.disconnect()
        logger.info("RSD Backend stopped")

    async def _safe_on_shutdown(self) -> None:
        try:
            await self._on_shutdown()
        except Exception:
            logging.getLogger("main").exception("RSD Backend shutdown failed")

    @asynccontextmanager
    async def lifespan(self, app: FastAPI):
        try:
            await self._on_startup()
        except Exception:
            logging.getLogger("main").exception("RSD Backend startup failed")
            await self._safe_on_shutdown()
            raise

        try:
            yield
        finally:
            await self._safe_on_shutdown()

    def _setup_logging(self):
        logging.basicConfig(
            level=getattr(logging, self.settings.log_level.upper(), logging.INFO),
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )

    def get_app(self) -> FastAPI:
        return self.app


def create_app() -> FastAPI:
    application = Application()
    return application.get_app()
