import os
from pathlib import Path
from typing import Optional

import yaml

from shared.config_utils import get_kafka_settings_from_shared


class Settings:
    USERS_SERVICE_URL: str = "http://localhost:8001"
    CHECKLISTS_SERVICE_URL: str = "http://localhost:8002"
    REPORTS_SERVICE_URL: str = "http://localhost:8003"
    ORGANIZATIONS_SERVICE_URL: str = "http://localhost:8004"
    ADMIN_SERVICE_URL: str = "http://localhost:8005"
    LOGGING_LEVEL: str = "INFO"
    KAFKA: Optional[dict] = None  # из shared config


def setup_config(config_path: Optional[str] = None) -> Settings:
    path_str = config_path or os.getenv("CONFIG_PATH", "config.yaml")
    config_file = Path(path_str)
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        services = data.get("services", {})
        if isinstance(services, dict):
            if services.get("users_service_url"):
                Settings.USERS_SERVICE_URL = services["users_service_url"]
            if services.get("checklists_service_url"):
                Settings.CHECKLISTS_SERVICE_URL = services["checklists_service_url"]
            if services.get("reports_service_url"):
                Settings.REPORTS_SERVICE_URL = services["reports_service_url"]
            if services.get("organizations_service_url"):
                Settings.ORGANIZATIONS_SERVICE_URL = services["organizations_service_url"]
            if services.get("admin_service_url"):
                Settings.ADMIN_SERVICE_URL = services["admin_service_url"]
        level = data.get("logging", {}).get("level", "INFO")
        if level in ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"):
            Settings.LOGGING_LEVEL = level
    for key in ("USERS_SERVICE_URL", "CHECKLISTS_SERVICE_URL", "REPORTS_SERVICE_URL", "ORGANIZATIONS_SERVICE_URL", "ADMIN_SERVICE_URL"):
        if os.getenv(key):
            setattr(Settings, key, os.getenv(key))
    Settings.KAFKA = get_kafka_settings_from_shared(os.environ)
    return Settings
