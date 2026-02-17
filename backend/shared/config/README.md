# Shared config

Общий конфиг для всех сервисов (источник настроек Kafka).

- **Файл:** `shared/config/default.yaml` (или путь из `SHARED_CONFIG_PATH`).
- **Использование:** в каждом сервисе в `setup_config` вызывается `get_kafka_settings_from_shared(os.environ)` — результат кладётся в `Settings.KAFKA`.
- В Docker для переопределения bootstrap_servers задайте `KAFKA_BOOTSTRAP_SERVERS` (например `kafka:9092`).

Креды S3 не в shared: только в **storage_service** (свой `config.yaml` с секцией `s3`).
