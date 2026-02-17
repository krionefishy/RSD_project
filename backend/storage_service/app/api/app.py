import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from shared.kafka_streams import start_kafka, stop_kafka
from shared.storage import S3ClientBase

from app.streams.consumers import STORAGE_CONSUMERS
from app.utils.config import setup_config, Settings


class Application:
    def __init__(self):
        self.app: FastAPI = FastAPI(
            title="Storage Service",
            description="Загрузка файлов в S3 по сообщениям из Kafka (StorageTopics)",
            lifespan=self.lifespan,
        )
        self.settings: Settings = None
        self.s3_client: S3ClientBase = None
        self._setup_routes()
        self._setup_middleware()

    def _setup_middleware(self):
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _setup_routes(self):
        @self.app.get("/health")
        async def health():
            return {"status": "ok", "service": "storage"}

    async def _on_startup(self):
        logger = logging.getLogger("main")
        logger.info("Storage service starting")
        config_path = os.getenv("CONFIG_PATH", "config.yaml")
        self.settings = setup_config(config_path=config_path)
        logging.basicConfig(
            level=getattr(logging, self.settings.LOGGING_LEVEL, "INFO"),
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )
        s3_cfg = self.settings.S3
        self.s3_client = S3ClientBase(
            endpoint_url=s3_cfg["endpoint_url"],
            tenant_id=s3_cfg["tenant_id"],
            key_id=s3_cfg["key_id"],
            secret_key=s3_cfg["secret_key"],
            bucket_name=s3_cfg["bucket_name"],
            region=s3_cfg.get("region", "ru-central-1"),
            verify=s3_cfg.get("verify", True),
        )
        kafka_cfg = self.settings.KAFKA
        if kafka_cfg:
            await start_kafka(
                self.app,
                bootstrap_servers=kafka_cfg["bootstrap_servers"],
                consumer_group=kafka_cfg.get("consumer_group", "storage_service"),
                max_request_size=kafka_cfg.get("max_request_size", 10 * 1024 * 1024),
                s3_client=self.s3_client,
                consumers=STORAGE_CONSUMERS,
                domain_consumers=[],
            )
        else:
            logger.warning("Kafka not configured, S3 consumers will not start")
        logger.info("Storage service started")

    async def _on_shutdown(self):
        await stop_kafka(self.app)

    @asynccontextmanager
    async def lifespan(self, app: FastAPI):
        await self._on_startup()
        yield
        await self._on_shutdown()


app = Application()
