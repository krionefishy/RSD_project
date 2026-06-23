import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import yaml

ServiceName = Literal["backend", "report_service"]


@dataclass(frozen=True)
class DatabaseConfig:
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
        return (
            f"postgresql+asyncpg://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.database}"
        )


@dataclass(frozen=True)
class JWTConfig:
    secret: str
    algorithm: str = "HS256"
    access_expire_seconds: int = 900
    refresh_expire_seconds: int = 259200
    rsa_private_key_pem: str | None = None
    rsa_key_size: int = 2048


@dataclass(frozen=True)
class ServiceJWTConfig:
    """JWT for backend-to-microservice calls (not user sessions)."""

    secret: str
    algorithm: str = "HS256"
    issuer: str = "rsd-backend"
    audience: str = "rsd-report-service"
    expire_seconds: int = 300
    allowed_subjects: tuple[str, ...] = ("backend",)


@dataclass(frozen=True)
class RedisConfig:
    host: str
    port: int = 6379
    db: int = 0


@dataclass(frozen=True)
class KafkaConfig:
    bootstrap_servers: str
    consumer_group: str = "rsd-backend-group"
    max_request_size: int = 24 * 1024 * 1024


@dataclass(frozen=True)
class S3Config:
    endpoint_url: str
    tenant_id: str
    key_id: str
    secret_key: str
    bucket_name: str
    region: str = "ru-central-1"
    verify: bool = True


@dataclass(frozen=True)
class ReportServiceClientConfig:
    enabled: bool = False
    base_url: str = "http://localhost:8001"
    timeout_seconds: float = 120.0


@dataclass(frozen=True)
class MainReplicaDatabaseConfig:
    enabled: bool = False
    host: str = "localhost"
    port: int = 5432
    user: str = "app"
    password: str = ""
    database: str = "rsd_db"
    echo: bool = False
    url_override: str | None = None

    @property
    def url(self) -> str:
        if self.url_override:
            return self.url_override
        return (
            f"postgresql+asyncpg://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.database}"
        )


@dataclass(frozen=True)
class Settings:
    database: DatabaseConfig
    jwt: JWTConfig
    service_jwt: ServiceJWTConfig
    redis: RedisConfig
    kafka: KafkaConfig
    report_service_client: ReportServiceClientConfig
    main_replica_database: MainReplicaDatabaseConfig
    s3: S3Config | None = None
    log_level: str = "INFO"
    env_mode: str = "production"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def settings_dir() -> Path:
    return Path(__file__).resolve().parent


def default_config_path() -> Path:
    return settings_dir() / "config.yaml"


def resolve_config_path(config_path: str | Path | None = None) -> Path:
    if config_path is not None:
        return Path(config_path)
    env_path = os.getenv("CONFIG_PATH")
    if env_path:
        return Path(env_path)
    settings = settings_dir()
    candidates = [
        settings / "config.yaml",
        settings / "config.yaml.example",
        repo_root() / "config.yaml",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return default_config_path()


def _load_yaml(config_path: str | Path | None = None) -> dict:
    path = resolve_config_path(config_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Config file not found: {path}. "
            f"Copy backend/shared/settings/config.yaml.example to backend/shared/settings/config.yaml"
        )
    with path.open(encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def _section(data: dict, backend: dict, name: str) -> dict:
    return backend.get(name) or data.get(name) or {}


def _get_any(data: dict, *keys: str, default=None):
    for key in keys:
        if key in data:
            return data[key]
    return default


def _parse_database(db_data: dict, *, url_override: str | None = None) -> DatabaseConfig:
    return DatabaseConfig(
        host=db_data.get("host", "localhost"),
        port=int(db_data.get("port", 5432)),
        user=db_data.get("user", "app"),
        password=db_data.get("password", "appsecret"),
        database=db_data.get("database", "rsd_db"),
        echo=bool(db_data.get("echo", False)),
        url_override=url_override or db_data.get("url"),
    )


def _parse_service_jwt(data: dict, backend: dict) -> ServiceJWTConfig:
    inter = data.get("inter_service_auth", {}).get("jwt", {})
    legacy = backend.get("service_jwt", {})
    merged = {**legacy, **inter}
    allowed = merged.get("allowed_subjects") or ["backend"]
    return ServiceJWTConfig(
        secret=merged.get("secret", "change-inter-service-secret-in-production"),
        algorithm=merged.get("algorithm", "HS256"),
        issuer=merged.get("issuer", "rsd-backend"),
        audience=merged.get("audience", "rsd-report-service"),
        expire_seconds=int(merged.get("expire_seconds", 300)),
        allowed_subjects=tuple(allowed),
    )


def _parse_main_replica(data: dict) -> MainReplicaDatabaseConfig:
    replica = data.get("main_replica_database") or {}
    return MainReplicaDatabaseConfig(
        enabled=bool(replica.get("enabled", False)),
        host=replica.get("host", "localhost"),
        port=int(replica.get("port", 5432)),
        user=replica.get("user", "app"),
        password=replica.get("password", ""),
        database=replica.get("database", "rsd_db"),
        echo=bool(replica.get("echo", False)),
        url_override=os.getenv("MAIN_REPLICA_DATABASE_URL") or replica.get("url"),
    )


def _parse_report_service_client(data: dict, backend: dict) -> ReportServiceClientConfig:
    services = data.get("services") or backend.get("services") or {}
    client = services.get("report_service") or {}
    return ReportServiceClientConfig(
        enabled=bool(client.get("enabled", False)),
        base_url=client.get("base_url", "http://localhost:8001"),
        timeout_seconds=float(client.get("timeout_seconds", 120)),
    )


def load_settings(
    config_path: str | Path | None = None,
    *,
    service: ServiceName = "backend",
) -> Settings:
    """Load settings from backend/shared/settings YAML for backend or a microservice."""
    data = _load_yaml(config_path)
    backend = data.get("backend", {})
    report_service = data.get("report_service", {})

    if service == "report_service":
        db_data = report_service.get("database", {})
        database = _parse_database(
            db_data,
            url_override=os.getenv("REPORT_SERVICE_DATABASE_URL"),
        )
        kafka_data = {**_section(data, backend, "kafka"), **report_service.get("kafka", {})}
    else:
        db_data = data.get("database", {})
        database = _parse_database(
            db_data,
            url_override=os.getenv("DATABASE_URL"),
        )
        kafka_data = _section(data, backend, "kafka")

    jwt_data = backend.get("jwt", {})
    jwt = JWTConfig(
        secret=jwt_data.get("secret", "change-me-in-production"),
        algorithm=jwt_data.get("algorithm", "HS256"),
        access_expire_seconds=int(jwt_data.get("access_expire_seconds", 900)),
        refresh_expire_seconds=int(jwt_data.get("refresh_expire_seconds", 259200)),
        rsa_private_key_pem=jwt_data.get("rsa_private_key_pem"),
        rsa_key_size=int(jwt_data.get("rsa_key_size", 2048)),
    )

    service_jwt = _parse_service_jwt(data, backend)
    redis_data = _section(data, backend, "redis")
    redis = RedisConfig(
        host=redis_data.get("host", "localhost"),
        port=int(redis_data.get("port", 6379)),
        db=int(redis_data.get("db", 0)),
    )
    kafka = KafkaConfig(
        bootstrap_servers=kafka_data.get("bootstrap_servers", "localhost:9092"),
        consumer_group=kafka_data.get("consumer_group", "rsd-backend-group"),
        max_request_size=int(kafka_data.get("max_request_size", 24 * 1024 * 1024)),
    )

    s3_data = _section(data, backend, "s3")
    s3 = None
    if s3_data:
        s3 = S3Config(
            endpoint_url=_get_any(s3_data, "endpoint_url", default=""),
            tenant_id=_get_any(s3_data, "tenant_id", default=""),
            key_id=_get_any(s3_data, "key_id", "S3_KEY_ID", default=""),
            secret_key=_get_any(s3_data, "secret_key", "S3_SECRET_KEY", default=""),
            bucket_name=_get_any(s3_data, "bucket_name", "S3_BUCKET_NAME", default="rsd-bucket"),
            region=_get_any(s3_data, "region", "S3_REGION", default="ru-central-1"),
            verify=bool(_get_any(s3_data, "verify", "S3_VERIFY", default=True)),
        )

    log_level = data.get("log_level") or backend.get("logging", {}).get("level", "INFO")
    env_mode = (
        data.get("environment")
        or backend.get("environment")
        or backend.get("env", {}).get("mode")
        or "production"
    )

    return Settings(
        database=database,
        jwt=jwt,
        service_jwt=service_jwt,
        redis=redis,
        kafka=kafka,
        s3=s3,
        report_service_client=_parse_report_service_client(data, backend),
        main_replica_database=_parse_main_replica(data),
        log_level=log_level,
        env_mode=env_mode,
    )
