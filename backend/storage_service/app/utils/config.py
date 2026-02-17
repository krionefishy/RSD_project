"""
Конфигурация storage_service: S3 — из своего config.yaml, Kafka — из shared config.
"""
import os
from pathlib import Path
from typing import Optional

import yaml

from shared.config_utils import get_kafka_settings_from_shared, get_s3_settings


class Settings:
    LOGGING_LEVEL: str = "INFO"
    S3: Optional[dict] = None  # endpoint_url, key_id, secret_key, bucket_name, tenant_id, region
    KAFKA: Optional[dict] = None  # из shared config


def setup_config(config_path: Optional[str] = None) -> Settings:
    path_str = config_path or os.getenv("CONFIG_PATH", "config.yaml")
    config_file = Path(path_str)
    if not config_file.exists():
        raise FileNotFoundError(f"Config file not found: {path_str}")
    with open(config_file, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    level = data.get("logging", {}).get("level", "INFO")
    if level in ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"):
        Settings.LOGGING_LEVEL = level
    Settings.S3 = get_s3_settings(data, os.environ)
    if not Settings.S3:
        raise ValueError("S3 section is required in storage_service config")
    Settings.KAFKA = get_kafka_settings_from_shared(os.environ)
    return Settings
