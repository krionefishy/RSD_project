"""Класс приложения в стиле Barista_KPI: db, store (аксессоры), без сервисного слоя."""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from shared import Database
from app.utils.config import setup_config, Settings
from app.utils.store import setup_store


class Application:
    def __init__(self):
        self.app: FastAPI = FastAPI(
            title="Users Service",
            description="Сервис пользователей (учётные записи, роли, профили, 2FA, привязка к ОКК и объектам)",
            lifespan=self.lifespan,
        )
        self.db: Database = Database()
        self.store = None
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
        from app.api.endpoints.user_routes import router as user_router

        self.app.include_router(user_router)

        @self.app.get("/health")
        async def health():
            return {"status": "ok", "service": "users"}

    async def _on_startup(self):
        logger = logging.getLogger("main")
        logger.info("Users service starting")
        config_path = os.getenv("CONFIG_PATH", "config.yaml")
        self.settings = setup_config(config_path=config_path)
        logger.info("Config loaded")
        self._setup_logging()

        await self.db.connect(self.settings.DATABASE_URL)

        setup_store(self)

        self.app.state.db = self.db
        self.app.state.store = self.store
        self.app.state.settings = self.settings

        logger.info("Users service started")

    async def _on_shutdown(self):
        logger = logging.getLogger("main")
        logger.info("Users service shutting down")
        await self.db.disconnect()

    @asynccontextmanager
    async def lifespan(self, app: FastAPI):
        await self._on_startup()
        yield
        await self._on_shutdown()


app = Application()
