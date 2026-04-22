import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import yaml


@dataclass(frozen=True)
class DatabaseConfig:
    """Database configuration."""
    host: str
    port: int
    user: str
    password: str
    database: str

    @property
    def url(self) -> str:
        return f"postgresql+asyncpg://{self.user}:{self.password}@{self.host}:{self.port}/{self.database}"


@dataclass(frozen=True)
class JWTConfig:
    """JWT configuration."""
    secret: str
    algorithm: str = "HS256"
    access_expire_seconds: int = 900  # 15 minutes
    refresh_expire_seconds: int = 259200  # 3 days
    rsa_private_key_pem: str | None = None
    rsa_key_size: int = 2048


@dataclass(frozen=True)
class RedisConfig:
    """Redis configuration."""
    host: str
    port: int = 6379
    db: int = 0


@dataclass(frozen=True)
class KafkaConfig:
    """Kafka configuration."""
    bootstrap_servers: str
    consumer_group: str = "rsd-backend-group"
    max_request_size: int = 10 * 1024 * 1024  # 10MB


@dataclass(frozen=True)
class S3Config:
    """S3 configuration."""
    endpoint_url: str
    tenant_id: str
    key_id: str
    secret_key: str
    bucket_name: str
    region: str = "ru-central-1"


@dataclass(frozen=True)
class Settings:
    """Application settings."""
    database: DatabaseConfig
    jwt: JWTConfig
    redis: RedisConfig
    kafka: KafkaConfig
    s3: S3Config | None = None
    log_level: str = "INFO"
    env_mode: str = "production"


def _load_yaml(config_path: str | Path | None = None) -> dict:
    """Load YAML config from path or CONFIG_PATH env var."""
    if config_path is None:
        config_path = os.getenv("CONFIG_PATH")
    if config_path is None:
        config_path = Path(__file__).resolve().parents[3] / "config.yaml"
    path = Path(config_path)
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_settings(config_path: str | Path | None = None) -> Settings:
    """Load settings from YAML file."""
    data = _load_yaml(config_path)

    # Database
    db_data = data.get("database", {})
    database = DatabaseConfig(
        host=db_data.get("host", "localhost"),
        port=db_data.get("port", 5432),
        user=db_data.get("user", "app"),
        password=db_data.get("password", "appsecret"),
        database=db_data.get("database", "rsd_db"),
    )

    # Backend section
    backend = data.get("backend", {})

    # JWT
    jwt_data = backend.get("jwt", {})
    jwt = JWTConfig(
        secret=jwt_data.get("secret", "change-me-in-production"),
        algorithm=jwt_data.get("algorithm", "HS256"),
        access_expire_seconds=jwt_data.get("access_expire_seconds", 900),
        refresh_expire_seconds=jwt_data.get("refresh_expire_seconds", 259200),
        rsa_private_key_pem=jwt_data.get("rsa_private_key_pem"),
        rsa_key_size=jwt_data.get("rsa_key_size", 2048),
    )

    # Redis
    redis_data = backend.get("redis", {})
    redis = RedisConfig(
        host=redis_data.get("host", "localhost"),
        port=redis_data.get("port", 6379),
        db=redis_data.get("db", 0),
    )

    # Kafka
    kafka_data = backend.get("kafka", {})
    kafka = KafkaConfig(
        bootstrap_servers=kafka_data.get("bootstrap_servers", "localhost:9092"),
        consumer_group=kafka_data.get("consumer_group", "rsd-backend-group"),
        max_request_size=kafka_data.get("max_request_size", 10 * 1024 * 1024),
    )

    # S3 (optional)
    s3_data = backend.get("s3")
    s3 = None
    if s3_data:
        s3 = S3Config(
            endpoint_url=s3_data.get("endpoint_url", ""),
            tenant_id=s3_data.get("tenant_id", ""),
            key_id=s3_data.get("key_id", ""),
            secret_key=s3_data.get("secret_key", ""),
            bucket_name=s3_data.get("bucket_name", "rsd-bucket"),
            region=s3_data.get("region", "ru-central-1"),
            verify=s3_data.get("verify", True),
        )

    # Logging and env
    log_level = backend.get("logging", {}).get("level", "INFO")
    env_mode = backend.get("env", {}).get("mode", "production")

    return Settings(
        database=database,
        jwt=jwt,
        redis=redis,
        kafka=kafka,
        s3=s3,
        log_level=log_level,
        env_mode=env_mode,
    )
