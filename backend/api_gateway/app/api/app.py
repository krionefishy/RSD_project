"""API Gateway: единая точка входа для PWA, маршрутизация на микросервисы, при необходимости — JWT."""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.utils.config import setup_config, Settings


class Application:
    def __init__(self):
        self.app: FastAPI = FastAPI(
            title="BOWSell Audit Trail — API Gateway",
            description="Маршрутизация запросов к users, checklists, reports, organizations, admin",
            lifespan=self.lifespan,
        )
        self.settings: Settings = None
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

    def _setup_logging(self):
        logging.basicConfig(
            level=getattr(logging, self.settings.LOGGING_LEVEL, "INFO"),
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )

    def _setup_routes(self):
        # TODO: подключать прокси-роуты к микросервисам (httpx) или Traefik/Nginx на уровне инфраструктуры
        @self.app.get("/health")
        async def health():
            return {"status": "ok", "service": "api-gateway"}

    async def _on_startup(self):
        logger = logging.getLogger("main")
        logger.info("API Gateway starting")
        config_path = os.getenv("CONFIG_PATH", "config.yaml")
        self.settings = setup_config(config_path=config_path)
        self._setup_logging()
        self.app.state.settings = self.settings
        logger.info("API Gateway started")

    async def _on_shutdown(self):
        pass

    @asynccontextmanager
    async def lifespan(self, app: FastAPI):
        await self._on_startup()
        yield
        await self._on_shutdown()


app = Application()
