"""Конфигурация сервиса из config.yaml."""
from pathlib import Path
from typing import Optional

import os
import yaml

SERVICE_URL_KEYS = (
    "users_service_url",
    "checklists_service_url",
    "reports_service_url",
    "organizations_service_url",
    "admin_service_url",
)


class Settings:
    DATABASE_URL: Optional[str] = None
    LOGGING_LEVEL: str = "INFO"
    SERVICES: dict[str, Optional[str]] = {k: None for k in SERVICE_URL_KEYS}


def setup_config(config_path: Optional[str] = None) -> Settings:
    path_str = config_path or os.getenv("CONFIG_PATH", "config.yaml")
    config_file = Path(path_str)

    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        database = data.get("database", {})
        if database:
            host = database.get("host", "localhost")
            port = database.get("port", 5432)
            user = database.get("user", "app")
            password = database.get("password", "appsecret")
            db_name = database.get("database", "audit_trail_db")
            Settings.DATABASE_URL = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db_name}"
        level = data.get("logging", {}).get("level", "INFO")
        if level in ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"):
            Settings.LOGGING_LEVEL = level
        services = data.get("services", {})
        if isinstance(services, dict):
            for key in SERVICE_URL_KEYS:
                if key in services and services[key]:
                    Settings.SERVICES[key] = services[key]
    else:
        Settings.DATABASE_URL = os.getenv("DATABASE_URL")
        if Settings.DATABASE_URL and Settings.DATABASE_URL.startswith("postgresql://"):
            Settings.DATABASE_URL = Settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        for key in SERVICE_URL_KEYS:
            Settings.SERVICES[key] = os.getenv(key.upper())

    if os.getenv("DATABASE_URL"):
        url = os.getenv("DATABASE_URL")
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        Settings.DATABASE_URL = url
    for key in SERVICE_URL_KEYS:
        if os.getenv(key.upper()):
            Settings.SERVICES[key] = os.getenv(key.upper())

    if not Settings.DATABASE_URL:
        raise ValueError("DATABASE_URL is not set (config file or env)")
    return Settings
