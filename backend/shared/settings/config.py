import os
from dataclasses import dataclass
from pathlib import Path

import yaml


@dataclass(frozen=True)
class DatabaseConfig:
    """Database configuration."""
    url: str
    echo: bool = False


@dataclass(frozen=True)
class KafkaConfig:
    """Kafka configuration."""
    bootstrap_servers: str
    client_id: str = "rsd-backend"
    consumer_group: str = "rsd-backend-group"
    max_request_size: int = 10 * 1024 * 1024  # 10MB


@dataclass(frozen=True)
class RedisConfig:
    """Redis configuration."""
    host: str
    port: int = 6379
    db: int = 0


@dataclass(frozen=True)
class S3Config:
    """S3 configuration."""
    endpoint_url: str
    tenant_id: str
    key_id: str
    secret_key: str
    bucket_name: str
    region: str = "ru-central-1"
    verify: bool = True


@dataclass(frozen=True)
class Settings:
    """Application settings."""
    database: DatabaseConfig
    kafka: KafkaConfig
    redis: RedisConfig
    s3: S3Config | None = None
    log_level: str = "INFO"


def load_settings(config_path: str) -> Settings:
    """Load settings from YAML file."""
    path = Path(config_path)
    
    # Build S3 config from env if available
    s3_config = None
    if os.getenv("S3_ENDPOINT_URL"):
        s3_config = S3Config(
            endpoint_url=os.getenv("S3_ENDPOINT_URL", ""),
            tenant_id=os.getenv("S3_TENANT_ID", ""),
            key_id=os.getenv("S3_KEY_ID", ""),
            secret_key=os.getenv("S3_SECRET_KEY", ""),
            bucket_name=os.getenv("S3_BUCKET_NAME", "rsd-bucket"),
            region=os.getenv("S3_REGION", "ru-central-1"),
            verify=os.getenv("S3_VERIFY", "true").lower() == "true",
        )
    
    if not path.exists():
        # Fallback to environment variables
        return Settings(
            database=DatabaseConfig(
                url=os.getenv("DATABASE_URL", "postgresql+asyncpg://app:appsecret@db:5432/rsd_db"),
                echo=False,
            ),
            kafka=KafkaConfig(
                bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"),
                client_id=os.getenv("KAFKA_CLIENT_ID", "rsd-backend"),
                consumer_group=os.getenv("KAFKA_CONSUMER_GROUP", "rsd-backend-group"),
                max_request_size=int(os.getenv("KAFKA_MAX_REQUEST_SIZE", str(10 * 1024 * 1024))),
            ),
            redis=RedisConfig(
                host=os.getenv("REDIS_HOST", "redis"),
                port=int(os.getenv("REDIS_PORT", "6379")),
                db=int(os.getenv("REDIS_DB", "0")),
            ),
            s3=s3_config,
            log_level=os.getenv("LOG_LEVEL", "INFO"),
        )
    
    with open(path, "r") as f:
        data = yaml.safe_load(f)
    
    s3_data = data.get("s3")
    if s3_data:
        s3_config = S3Config(**s3_data)
    
    return Settings(
        database=DatabaseConfig(**data.get("database", {})),
        kafka=KafkaConfig(**data.get("kafka", {})),
        redis=RedisConfig(**data.get("redis", {})),
        s3=s3_config,
        log_level=data.get("log_level", "INFO"),
    )
