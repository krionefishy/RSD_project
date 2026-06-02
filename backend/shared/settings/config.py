import os
from dataclasses import dataclass
from pathlib import Path

import yaml


@dataclass(frozen=True)
class DatabaseConfig:
    """Database configuration."""
    host: str
    port: int
    user: str
    password: str
    database: str
    echo: bool = False
    url_override: str | None = None

    @property
    def url(self) -> str:
        if self.url_override:
            return self.url_override
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
    verify: bool = True


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
        return yaml.safe_load(f) or {}


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.lower() in {"1", "true", "yes", "on"}


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    return int(raw)


def _section(data: dict, backend: dict, name: str) -> dict:
    return backend.get(name) or data.get(name) or {}


def _get_any(data: dict, *keys: str, default=None):
    for key in keys:
        if key in data:
            return data[key]
    return default


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
        echo=_env_bool("DATABASE_ECHO", db_data.get("echo", False)),
        url_override=os.getenv("DATABASE_URL") or db_data.get("url"),
    )

    # Backend section
    backend = data.get("backend", {})

    # JWT
    jwt_data = backend.get("jwt", {})
    jwt = JWTConfig(
        secret=os.getenv("JWT_SECRET") or jwt_data.get("secret", "change-me-in-production"),
        algorithm=os.getenv("JWT_ALGORITHM") or jwt_data.get("algorithm", "HS256"),
        access_expire_seconds=_env_int(
            "JWT_ACCESS_EXPIRE_SECONDS",
            jwt_data.get("access_expire_seconds", 900),
        ),
        refresh_expire_seconds=_env_int(
            "JWT_REFRESH_EXPIRE_SECONDS",
            jwt_data.get("refresh_expire_seconds", 259200),
        ),
        rsa_private_key_pem=os.getenv("AUTH_RSA_PRIVATE_KEY_PEM") or jwt_data.get("rsa_private_key_pem"),
        rsa_key_size=_env_int("AUTH_RSA_KEY_SIZE", jwt_data.get("rsa_key_size", 2048)),
    )

    # Redis
    redis_data = _section(data, backend, "redis")
    redis = RedisConfig(
        host=os.getenv("REDIS_HOST") or redis_data.get("host", "localhost"),
        port=_env_int("REDIS_PORT", redis_data.get("port", 6379)),
        db=_env_int("REDIS_DB", redis_data.get("db", 0)),
    )

    # Kafka
    kafka_data = _section(data, backend, "kafka")
    kafka = KafkaConfig(
        bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS")
        or kafka_data.get("bootstrap_servers", "localhost:9092"),
        consumer_group=os.getenv("KAFKA_CONSUMER_GROUP")
        or kafka_data.get("consumer_group", "rsd-backend-group"),
        max_request_size=_env_int(
            "KAFKA_MAX_REQUEST_SIZE",
            kafka_data.get("max_request_size", 10 * 1024 * 1024),
        ),
    )

    # S3 (optional)
    s3_data = _section(data, backend, "s3")
    s3 = None
    if s3_data or os.getenv("S3_ENDPOINT_URL"):
        s3 = S3Config(
            endpoint_url=os.getenv("S3_ENDPOINT_URL") or _get_any(s3_data, "endpoint_url", "S3_ENDPOINT_URL", default=""),
            tenant_id=os.getenv("S3_TENANT_ID") or _get_any(s3_data, "tenant_id", "S3_TENANT_ID", default=""),
            key_id=os.getenv("S3_KEY_ID")
            or os.getenv("S3_KEYID")
            or _get_any(s3_data, "key_id", "S3_KEY_ID", "S3_KEYID", default=""),
            secret_key=os.getenv("S3_SECRET_KEY")
            or _get_any(s3_data, "secret_key", "S3_SECRET_KEY", default=""),
            bucket_name=os.getenv("S3_BUCKET_NAME")
            or _get_any(s3_data, "bucket_name", "S3_BUCKET_NAME", default="rsd-bucket"),
            region=os.getenv("S3_REGION") or _get_any(s3_data, "region", "S3_REGION", default="ru-central-1"),
            verify=_env_bool("S3_VERIFY", _get_any(s3_data, "verify", "S3_VERIFY", default=True)),
        )

    # Logging and env
    log_level = os.getenv("LOG_LEVEL") or data.get("log_level") or backend.get("logging", {}).get("level", "INFO")
    env_mode = (
        os.getenv("ENVIRONMENT")
        or data.get("environment")
        or backend.get("environment")
        or backend.get("env", {}).get("mode")
        or "production"
    )

    return Settings(
        database=database,
        jwt=jwt,
        redis=redis,
        kafka=kafka,
        s3=s3,
        log_level=log_level,
        env_mode=env_mode,
    )
