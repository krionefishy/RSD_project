"""
Общие хелперы конфигурации.
- Kafka: читается из shared config (один файл для всех сервисов).
- S3: только в storage_service (get_s3_settings из своего config.yaml).
"""
import os
from pathlib import Path
from typing import Any, Optional

import yaml


def _shared_config_path() -> Path:
    """Путь к shared config: SHARED_CONFIG_PATH или shared/config/default.yaml."""
    env_path = os.getenv("SHARED_CONFIG_PATH", "").strip()
    if env_path:
        return Path(env_path)
    return Path(__file__).resolve().parent / "config" / "default.yaml"


def get_kafka_settings_from_shared(env: Any = None) -> Optional[dict]:
    """
    Прочитать настройки Kafka из shared config (один источник для всех сервисов).
    env — os.environ или dict для переопределения (KAFKA_BOOTSTRAP_SERVERS, KAFKA_MAX_REQUEST_SIZE).
    """
    env = env or os.environ
    path = _shared_config_path()
    if not path.exists():
        bootstrap = (env.get("KAFKA_BOOTSTRAP_SERVERS") or "").strip()
        if not bootstrap:
            return None
        return {
            "bootstrap_servers": bootstrap,
            "consumer_group": env.get("KAFKA_CONSUMER_GROUP", "audit_trail_consumer"),
            "max_request_size": 10 * 1024 * 1024,
        }
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    kafka = data.get("kafka") or {}
    bootstrap = (env.get("KAFKA_BOOTSTRAP_SERVERS") or kafka.get("bootstrap_servers") or "").strip()
    if not bootstrap:
        return None
    out = {
        "bootstrap_servers": bootstrap,
        "consumer_group": env.get("KAFKA_CONSUMER_GROUP") or kafka.get("consumer_group", "audit_trail_consumer"),
        "max_request_size": 10 * 1024 * 1024,
    }
    if "max_request_size" in kafka:
        try:
            out["max_request_size"] = int(kafka["max_request_size"])
        except (TypeError, ValueError):
            pass
    if env.get("KAFKA_MAX_REQUEST_SIZE"):
        try:
            out["max_request_size"] = int(env["KAFKA_MAX_REQUEST_SIZE"])
        except ValueError:
            pass
    return out


def get_s3_settings(data: Optional[dict], env: Any) -> Optional[dict]:
    """Вернуть dict с endpoint_url, key_id, secret_key, bucket_name, tenant_id, region или None."""
    s3 = (data or {}).get("s3") if isinstance(data, dict) else None
    if not s3:
        return None
    endpoint = (s3.get("endpoint_url") or s3.get("S3_ENDPOINT_URL") or "").strip()
    if not endpoint:
        return None
    return {
        "endpoint_url": endpoint,
        "key_id": s3.get("key_id") or s3.get("S3_KEYID", ""),
        "secret_key": s3.get("secret_key") or s3.get("S3_SECRET_KEY", ""),
        "bucket_name": s3.get("bucket_name") or s3.get("S3_BUCKET_NAME", ""),
        "tenant_id": s3.get("tenant_id") or s3.get("S3_TENANT_ID", ""),
        "region": s3.get("region", "ru-central-1"),
        "verify": s3.get("verify", True),
    }
