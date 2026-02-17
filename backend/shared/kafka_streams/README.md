# Kafka: инструкция при добавлении/подключении сервисов

Чеклист для подключения Kafka к микросервису и при добавлении новых сервисов.

---

## Чеклист: новый микросервис (без Kafka)

- [ ] Создать каталог `backend/<service>_service/` по образцу существующего (app, config, main, requirements, tests).
- [ ] Добавить `config.example.yaml` и `config.test.yaml`, скопировать пример в `config.yaml` при разработке.
- [ ] В `app/utils/store.py` завести нужные аксессоры, в `app/api/app.py` — маршруты и lifespan с `setup_store`, без `start_kafka`.
- [ ] При необходимости добавить сервис в `docker-compose.yml` и в `justfile` (venv, test, run).

---

## Чеклист: микросервис публикует события в Kafka

**Любой сервис с подключённым Kafka может публиковать в любой существующий топик** (StorageTopics или доменный). Ограничений «только этот сервис шлёт в этот топик» нет.

- [ ] В `config.yaml` (и в `config.example.yaml`) добавить секцию `kafka`:
  - `bootstrap_servers` (например `localhost:9092` или `kafka:9092` в Docker)
  - `consumer_group` (для подписчиков этого сервиса; для одной только публикации можно задать любое)
- [ ] В `Application._on_startup` после БД и store вызвать `start_kafka`. Параметры `consumers` и `domain_consumers` задают **только подписчиков этого сервиса** (кого слушаем), а не то, куда он может писать:
  ```python
  from shared.kafka_streams import start_kafka
  await start_kafka(
      self.app,
      bootstrap_servers=...,
      consumer_group=...,
      s3_client=...,       # если в этом сервисе есть S3-подписчики
      consumers=...,       # S3-подписчики этого сервиса или []
      domain_consumers=..., # доменные подписчики этого сервиса или []
  )
  ```
- [ ] В `Application._on_shutdown` вызвать `await stop_kafka(self.app)`.
- [ ] В эндпоинтах: **Depends(get_producer)** и **await producer.send(topic, payload)**. Топик — любой из объявленных в `topics.py` или строка с именем топика:
  ```python
  from fastapi import Depends
  from shared.kafka_streams import get_producer, StorageTopics, DomainEvents, Domains

  @router.post("/...")
  async def some_action(producer=Depends(get_producer)):
      await producer.send(StorageTopics.REPORT, {"key": "...", "content_base64": "..."})
      await producer.send(DomainEvents.topic(Domains.ORGANIZATIONS, "link_expired"), {"id": 1})
      return ...
  ```
- [ ] Новые топики при необходимости добавлять в `shared/kafka_streams/topics.py` (StorageTopics — константы, DomainEvents — метод `topic(domain, event)` или именованные константы; домены — из `Domains`).

---

## Чеклист: микросервис подписывается на доменные события

- [ ] В сервисе завести модуль подписчиков (например `app/kafka_subscribers.py` или `app/subscribers/domain.py`).
- [ ] Обработчик оформить через **@kafka_domain_subscriber(topic)**. Сигнатура: **async def handler(ctx: KafkaHandlerContext, payload: dict) -> None**. Внутри использовать только **ctx.store**, **ctx.db**, **ctx.settings**.
- [ ] Собрать список обработчиков и передать его в `start_kafka(..., domain_consumers=[...])` в `_on_startup` этого сервиса.
- [ ] В `config.yaml` этого сервиса указать `kafka` (bootstrap_servers, consumer_group). У подписчика свой consumer_group (часто по имени сервиса).

---

## Чеклист: микросервис подписывается на S3 (StorageTopics)

- [ ] Реализовать обработчики с декоратором **@kafka_subscriber(topic)**. Сигнатура: **async def handler(s3_client, payload: dict) -> None**.
- [ ] Добавить их в список и передать в `start_kafka(..., consumers=[...], s3_client=s3_client)`.
- [ ] В сервисе должен быть настроен и передан в `start_kafka` клиент S3.

---

## Сводка по ролям

| Задача | Где | Действие |
|--------|-----|----------|
| Публикация события | Любой сервис с Kafka | `producer = Depends(get_producer)`, `await producer.send(topic, payload)`. Топик — любой из существующих. |
| Обработка доменного события | Сервис, который должен реагировать на событие | Подписчик с `@kafka_domain_subscriber(topic)`, в handler — `ctx.store` / `ctx.db` |
| Пример: ссылка expired → обновить users | Кто шлёт: сервис, где обрабатывается переход (например organizations). Кто обрабатывает: users_service | В том сервисе, где помечаем ссылку expired, вызываем `producer.send(topic, payload)`. В users_service — domain_consumer по этому топику, в handler обновляем запись через `ctx.store`. |

---

## Стилистика и константы топиков (`topics.py`)

- **Префикс:** все топики начинаются с `audit_trail`.
- **Сторедж (S3):** `audit_trail.storage.s3.<тип>.upload` — константы в **StorageTopics** (REPORT, CHECKLIST_REPORT, AUDIT_REPORT).
- **Домен:** `audit_trail.domain.<домен>.<событие>` — имена доменов в **Domains** (ORGANIZATIONS, USERS, CHECKLISTS, REPORTS, ADMIN), имя топика: **DomainEvents.topic(domain, event)** или именованная константа в DomainEvents.

## Типы топиков

- **StorageTopics** — загрузка файлов в S3 (payload с ключом и base64-контентом). Подписчик: `@kafka_subscriber(topic)`, аргументы `(s3_client, payload)`.
- **DomainEvents** — обмен между сервисами. Топик: `DomainEvents.topic(Domains.<домен>, "event_name")` или константа из `topics.py`. Подписчик: `@kafka_domain_subscriber(topic)`, аргументы `(ctx: KafkaHandlerContext, payload)`. Контекст даёт только `store`, `db`, `settings` — без передачи `app`.
