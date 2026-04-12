"""Конфигурация сервиса из shared/config/config.yaml с поддержкой переменных окружения."""
import os
import re
from pathlib import Path
from typing import Optional

import yaml

SERVICE_URL_KEYS = (
    "gateway_url",
    "auth_service_url",
    "knowledge_base_service_url",
)


def expand_env_vars(value):
    """Заменяет ${VAR} или ${VAR:-default} на значения из переменных окружения."""
    if not isinstance(value, str):
        return value

    pattern = re.compile(r'\$\{(\w+)(?::-([^}]*))?\}')

    def replace(match):
        var_name = match.group(1)
        default = match.group(2)
        env_value = os.getenv(var_name)
        if env_value is not None:
            return env_value
        if default is not None:
            return default
        return match.group(0)

    return pattern.sub(replace, value)


def deep_expand(data):
    """Рекурсивно заменяет переменные окружения во всех строках."""
    if isinstance(data, dict):
        return {key: deep_expand(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [deep_expand(item) for item in data]
    elif isinstance(data, str):
        return expand_env_vars(data)
    return data


class Settings:
    DATABASE_URL: Optional[str] = None
    LOGGING_LEVEL: str = "INFO"
    SERVICES: dict[str, Optional[str]] = {k: None for k in SERVICE_URL_KEYS}
    KAFKA: Optional[dict] = None
    REDIS: Optional[dict] = None
    SECURITY: Optional[dict] = None


def setup_config(config_path: Optional[str] = None) -> Settings:
    """Загружает конфиг из YAML с подстановкой переменных окружения."""
    # Сначала проверяем переменные окружения (приоритет выше)
    if os.getenv("DATABASE_URL"):
        url = os.getenv("DATABASE_URL")
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        Settings.DATABASE_URL = url

    for key in SERVICE_URL_KEYS:
        env_val = os.getenv(key.upper())
        if env_val:
            Settings.SERVICES[key] = env_val

    # Загружаем YAML конфиг если путь указан и файл существует
    path_str = config_path or os.getenv("CONFIG_PATH")
    if path_str:
        config_file = Path(path_str)
        if config_file.exists():
            with open(config_file, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}

            # Разворачиваем переменные окружения
            data = deep_expand(data)

            # База данных
            if not Settings.DATABASE_URL:
                database = data.get("database", {})
                if database:
                    host = database.get("host", "localhost")
                    port = database.get("port", 5432)
                    user = database.get("user", "app")
                    password = database.get("password", "appsecret")
                    db_name = database.get("database", "rsd_db")
                    Settings.DATABASE_URL = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db_name}"

            # Логирование
            logging = data.get("logging", {})
            level = logging.get("level", "INFO")
            if level in ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"):
                Settings.LOGGING_LEVEL = level

            # Сервисы
            services = data.get("services", {})
            if isinstance(services, dict):
                for key in SERVICE_URL_KEYS:
                    if key in services and services[key] and not Settings.SERVICES.get(key):
                        Settings.SERVICES[key] = services[key]

            # Kafka
            Settings.KAFKA = data.get("kafka", {})

            # Redis
            Settings.REDIS = data.get("redis", {})

            # Security
            Settings.SECURITY = data.get("security", {})

    # Переопределяем Kafka через env если заданы
    kafka_bootstrap = os.getenv("KAFKA_BOOTSTRAP_SERVERS")
    if kafka_bootstrap:
        if not Settings.KAFKA:
            Settings.KAFKA = {}
        Settings.KAFKA["bootstrap_servers"] = kafka_bootstrap

    kafka_client = os.getenv("KAFKA_CLIENT_ID")
    if kafka_client:
        if not Settings.KAFKA:
            Settings.KAFKA = {}
        Settings.KAFKA["client_id"] = kafka_client

    # Переопределяем Redis через env если заданы
    redis_host = os.getenv("REDIS_HOST")
    if redis_host:
        if not Settings.REDIS:
            Settings.REDIS = {}
        Settings.REDIS["host"] = redis_host

    if not Settings.DATABASE_URL:
        raise ValueError("DATABASE_URL is not set (config file or env)")

    return Settings
