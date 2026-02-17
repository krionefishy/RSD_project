# BOWSell Audit Trail — ОКК (Отделы контроля качества)

Сервис для автоматизации работы отделов контроля качества: ведение журналов аудитов, назначение проверок предприятиям, аналитика по объектам и др.

Монорепозиторий: шаблон проекта по ТЗ «BOWSell Audit Trail» (журналы аудитов и отчётность ОКК).

## Стек (по ТЗ)

- **Frontend:** PWA на React
- **Backend:** микросервисы на Python 3.12+, FastAPI, SQLAlchemy (async), единая БД PostgreSQL 15+
- **Миграции:** Alembic (общие для всей БД)
- **Взаимодействие:** API Gateway (единая точка входа), между сервисами — HTTP и при необходимости Apache Kafka
- **Хранилище:** S3 (загрузка файлов через Kafka-подписчики, см. `backend/shared/kafka_streams/`)

## Структура монорепо

```
Audit_trail_prj/
├── backend/
│   ├── shared/                 # Base, Database, kafka_streams (Kafka/S3)
│   ├── users_service/          # config.yaml, config.example.yaml, config.test.yaml
│   ├── checklists_service/
│   ├── reports_service/
│   ├── organizations_service/
│   ├── admin_service/
│   └── api_gateway/
├── frontend/
├── migrations/
├── docker-compose.yml          # Полный стек (только API Gateway смотрит наружу)
├── docker-compose.local.yml    # Локальная разработка: только db + kafka
├── justfile                    # Сценарии: тесты, deps, db-recreate, run
└── README.md
```

У каждого микросервиса: свой `config.yaml`, `config.example.yaml`, `config.test.yaml`, свой `requirements.txt`, тесты в `tests/`.

---

## Настройка проекта

### 1. Окружение

- Python 3.12+
- [just](https://github.com/casey/just) (опционально, для сценариев)
- Docker и Docker Compose — для БД и полного стека

### 2. Конфигурация

Важные настройки хранятся в **config.yaml** каждого сервиса. Репозиторий содержит только шаблоны:

- В каждом сервисе есть **config.example.yaml** — скопируйте его в **config.yaml** и подставьте свои значения (хост БД, пароли, при необходимости S3/Kafka).

```bash
# Пример для одного сервиса
cp backend/users_service/config.example.yaml backend/users_service/config.yaml
# Отредактируйте backend/users_service/config.yaml
```

Аналогично для `checklists_service`, `reports_service`, `organizations_service`, `admin_service`, `api_gateway`.

- **config.test.yaml** — конфиг для тестов (уже в репо, без секретов). Используется при `just test <service>`.

### 3. Переменные окружения

В корне можно задать **.env** (по образцу **.env.example**):

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_HOST`, `DB_PORT` — для сборки `DATABASE_URL` в docker-compose и для миграций.

```bash
cp .env.example .env
# Заполните .env при необходимости
```

### 4. База данных

- **Локально (Docker):** поднять только БД и Kafka:  
  `docker compose -f docker-compose.local.yml up -d`  
  БД будет доступна на `localhost:5432`, Kafka на `localhost:9092`.

- **Создание БД:** при первом запуске создаётся контейнером PostgreSQL из переменных `POSTGRES_*`. Имя БД по умолчанию — `audit_trail_db`.

- **Миграции:** после поднятия БД выполнить из корня репозитория:

```bash
export DATABASE_URL=postgresql+asyncpg://app:appsecret@localhost:5432/audit_trail_db
alembic upgrade head
```

Для тестов можно использовать отдельную БД (например, `audit_trail_test`), создав её вручную и указав в `config.test.yaml`.

### 5. Зависимости

Установка зависимостей одного сервиса или всех:

```bash
just deps users
# или
just deps-all
```

Либо вручную: `pip install -r backend/<service>_service/requirements.txt`.

---

## Сценарии (just)

Установите [just](https://github.com/casey/just), затем из корня репозитория:

| Команда | Описание |
|--------|----------|
| `just venv <service>` | Создать `.venv` в каталоге сервиса и установить зависимости (users, checklists, reports, organizations, admin, api_gateway) |
| `just venv-all` | Создать отдельный venv для каждого микросервиса и установить зависимости |
| `just test <service>` | Тесты одного сервиса (при наличии `.venv` используется его pytest) |
| `just test-all` | Тесты всех микросервисов |
| `just deps <service>` | Установить зависимости одного сервиса в текущее окружение |
| `just deps-all` | Установить зависимости всех сервисов в текущее окружение |
| `just db-recreate` | Пересоздать БД (down -v, up db, alembic upgrade head) |
| `just local-up` | Поднять только db + kafka (docker-compose.local.yml) |
| `just local-down` | Остановить local compose |
| `just run <service>` | Запустить один микросервис локально (ожидается поднятая БД; при наличии `.venv` сервиса используется он) |
| `just run-gateway` | Запустить API Gateway локально (при наличии `api_gateway/.venv` используется он) |
| `just up` | Поднять полный стек (docker-compose.yml) |
| `just down` | Остановить полный стек |
| `just migrate` | Применить миграции |
| `just migrate-new "описание"` | Создать новую миграцию (autogenerate) |

Для `just run` и тестов по умолчанию используется `DATABASE_URL=postgresql+asyncpg://app:appsecret@localhost:5432/audit_trail_db`. Переопределите через `export DATABASE_URL=...` при необходимости.

---

## Запуск полного стека (Docker)

Из корня:

```bash
docker compose up -d
```

Наружу смотрит только **API Gateway**: `http://localhost:8080`. БД и остальные сервисы доступны только внутри Docker-сети.

---

## Локальная разработка

1. Поднять БД (и при необходимости Kafka):  
   `just local-up` или  
   `docker compose -f docker-compose.local.yml up -d`

2. Применить миграции:  
   `just migrate` (или `DATABASE_URL=... alembic upgrade head`)

3. Создать config.yaml из config.example.yaml для нужных сервисов.

4. Запускать сервисы на хосте, например:  
   `just run users`  
   `just run checklists`  
   В другом терминале: `just run-gateway` (порт 8080).

---

## Миграции (Alembic)

- Конфиг: **alembic.ini** в корне, `script_location = migrations`.
- Применить:  
  `DATABASE_URL=postgresql+asyncpg://app:appsecret@localhost:5432/audit_trail_db alembic upgrade head`
- Новая миграция:  
  `alembic revision --autogenerate -m "описание"`

---

## Kafka и S3

В **backend/shared/kafka_streams/** вынесены:

- **topics.py** — топики для загрузки в S3 (отчёты, чек-листы и т.д.).
- **consumer.py** — декоратор `@kafka_subscriber(topic)` для обработчиков сообщений (s3_client, payload).
- **kafka.py** — `start_kafka` / `stop_kafka` (producer + список consumer-задач).
- **subscribers/** — подписчики на топики (запись в S3). Список регистрируется при старте приложения.

Сервисы, которые будут публиковать события или подписываться на топики, должны добавить в config.yaml секции **kafka** и при необходимости **s3** (см. config.example.yaml в users_service). Подключение Kafka/S3 в Application — по образцу Barista_KPI_project (start_kafka при lifespan, передача bootstrap_servers, consumer_group, s3_client).

---

## CI/CD

В репозитории Barista_KPI_project используется GitHub Actions (`.github/workflows/ci.yaml`, `docker-compose.ci.yaml`, тесты в контейнере). Для Audit Trail CI/CD планируется адаптировать под монорепо и несколько микросервисов: отдельные шаги тестов по сервисам, общие миграции, сборка образов. Заготовка под workflow и docker-compose для CI будет добавлена при настройке пайплайна.
