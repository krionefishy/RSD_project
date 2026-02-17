# Shared S3 client

**S3ClientBase** — базовый S3-клиент (boto3, path-style) для S3-совместимых бэкендов (MinIO, cloud.ru и т.п.).

- Зависимость: `boto3` (добавить в requirements сервиса, который использует S3).
- Создавать в **сервисе** при старте (в `_on_startup`), если сервис работает с S3 или подписан на StorageTopics: из `Settings.S3` передать параметры в конструктор, сохранить клиент в `app.state` и при вызове `start_kafka(..., s3_client=...)` передать его для подписчиков S3-топиков.

Пример (в app сервиса):

```python
from shared.storage import S3ClientBase

# В _on_startup после setup_config:
if self.settings.S3:
    self.s3_client = S3ClientBase(
        endpoint_url=self.settings.S3["endpoint_url"],
        tenant_id=self.settings.S3["tenant_id"],
        key_id=self.settings.S3["key_id"],
        secret_key=self.settings.S3["secret_key"],
        bucket_name=self.settings.S3["bucket_name"],
        region=self.settings.S3.get("region", "ru-central-1"),
    )
else:
    self.s3_client = None
# ...
await start_kafka(..., s3_client=self.s3_client, consumers=..., domain_consumers=...)
```
