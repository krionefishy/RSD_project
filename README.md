# RSD — Retail Staff Development

Корпоративная платформа «Мобильный кабинет Продавца» для сети розничных точек: обучение персонала, отслеживание продаж, рейтинги и мотивация.

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | React 19, Redux Toolkit, React Router 7, axios, CSS Modules (PWA) |
| Backend | Python 3.12+, FastAPI, SQLAlchemy (async), микросервисная архитектура |
| БД | PostgreSQL 15+ |
| Миграции | Alembic (единые для всей БД) |
| Очереди | Apache Kafka |
| Кэш | Redis 7 |
| Хранилище | S3 (через Kafka-подписчики) |
| API Gateway | nginx (prod) / FastAPI gateway (dev) |
| Reverse Proxy | Traefik (prod, SSL через Let's Encrypt) |
| Контейнеризация | Docker, Docker Compose |

---

## Структура репозитория

```
RSD/
├── backend/
│   ├── shared/                    # Общие модули: DB, Kafka, S3, config
│   │   ├── config/                #   config.yaml, config.example.yaml, default.yaml
│   │   ├── kafka_streams/         #   producer, consumer, subscribers, topics
│   │   └── storage/               #   s3_client
│   ├── users_service/             # Сервис пользователей
│   ├── admin_service/             # Сервис администрирования
│   ├── knowledge_base_service/    # Сервис базы знаний
│   └── api_gateway/               # API Gateway (FastAPI)
├── frontend/                      # React PWA
│   ├── public/                    #   manifest.json, service-worker, index.html
│   ├── src/                       #   pages/, components/, api/, features/, etc.
│   ├── Dockerfile                 #   Multi-stage: node build → nginx
│   └── nginx.conf                 #   SPA-конфигурация
├── migrations/                    # Alembic миграции (общие для всех сервисов)
│   ├── env.py
│   └── versions/
├── docs/                          # Документация и ТЗ
│   ├── ROLE_MODEL.md              #   Ролевая модель (8 ролей)
│   ├── DESIGN_BRIEF.md            #   ТЗ на дизайн
│   └── ТЗ блок базы знаний.docx
├── docker-compose.yml             # Полный стек (все сервисы)
├── docker-compose.local.yml       # Локальная разработка (только DB + Kafka)
├── docker-compose.prod.yaml       # Production (Traefik + SSL)
├── docker-compose.ci.yaml         # CI (только тестовая БД)
├── Dockerfile                     # Общий Python-образ для бэкенд-сервисов
├── nginx_gateway.conf             # Конфиг nginx gateway (prod)
├── alembic.ini                    # Конфигурация Alembic
├── justfile                       # Сценарии автоматизации
├── .env.example                   # Шаблон переменных окружения
└── .github/workflows/ci.yaml      # GitHub Actions CI
```

### Структура бэкенд-сервиса (шаблон)

```
backend/<service_name>/
├── app/
│   ├── api/                       # FastAPI: app.py, dependencies.py, endpoints/
│   ├── repository/                # SQLAlchemy: models.py, base.py, accessors/
│   ├── streams/                   # Kafka consumers
│   └── utils/                     # config.py, store.py
├── tests/
├── main.py                        # Точка входа (uvicorn)
├── Dockerfile
├── requirements.txt
├── config.yaml                    # Рабочий конфиг (не в git)
├── config.example.yaml            # Шаблон конфига
└── config.test.yaml               # Конфиг для тестов
```

---

## Требования

- **Docker** и **Docker Compose** — обязательно
- **Python 3.12+** — для локальной разработки бэкенда
- **Node.js 20+** и **npm** — для локальной разработки фронтенда
- **[just](https://github.com/casey/just)** — опционально, для удобных сценариев

### Установка just

```bash
# macOS
brew install just

# Linux (Ubuntu/Debian)
sudo apt install just

# Или через cargo
cargo install just
```

---

## Быстрый старт с нуля

### 1. Клонирование репозитория

```bash
git clone <repo-url> RSD
cd RSD
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
```

Отредактируйте `.env` при необходимости. Значения по умолчанию работают для локальной разработки:

```env
DB_HOST=db
DB_PORT=5432
DB_USER=app
DB_PASSWORD=appsecret
DB_NAME=rsd_db

KAFKA_BOOTSTRAP_SERVERS=kafka:9092
JWT_SECRET=change-me-in-production
```

### 3. Конфигурация бэкенд-сервисов

Каждому сервису нужен свой `config.yaml`. Создайте его из шаблона:

```bash
# Для каждого существующего сервиса
cp backend/users_service/config.example.yaml backend/users_service/config.yaml
cp backend/admin_service/config.example.yaml backend/admin_service/config.yaml
cp backend/api_gateway/config.example.yaml backend/api_gateway/config.yaml
```

Также скопируйте shared-конфиг:

```bash
cp backend/shared/config/config.example.yaml backend/shared/config/config.yaml
```

### 4. Поднять инфраструктуру (DB + Kafka)

```bash
just local-up
# или без just:
docker compose -f docker-compose.local.yml up -d
```

Дождитесь готовности (обычно 10–15 секунд):
- PostgreSQL: `localhost:5432`
- Kafka: `localhost:9092`

Проверка:

```bash
docker compose -f docker-compose.local.yml ps
```

### 5. Применить миграции БД

```bash
just migrate
# или без just:
DATABASE_URL=postgresql+asyncpg://app:appsecret@localhost:5432/audit_trail_db alembic upgrade head
```

### 6. Запуск бэкенда

#### Вариант A: через just (рекомендуется)

```bash
# Создать виртуальные окружения и установить зависимости
just venv users
just venv admin
just venv api_gateway

# Запустить сервисы (каждый в отдельном терминале)
just run users         # users_service → порт 8000
just run admin         # admin_service → порт 8000
just run-gateway       # api_gateway   → порт 8080
```

#### Вариант B: вручную

```bash
# Создать venv
python3 -m venv backend/users_service/.venv
backend/users_service/.venv/bin/pip install -r backend/users_service/requirements.txt

# Запустить
cd backend && \
PYTHONPATH=.:users_service \
CONFIG_PATH=users_service/config.yaml \
DATABASE_URL=postgresql+asyncpg://app:appsecret@localhost:5432/audit_trail_db \
users_service/.venv/bin/python users_service/main.py
```

### 7. Запуск фронтенда

```bash
cd frontend
npm ci
npm start
```

Фронтенд запустится на `http://localhost:3000`.

---

## Режимы запуска

### Локальная разработка (рекомендуется)

Инфраструктура в Docker, сервисы и фронтенд — на хосте.

```bash
# 1. Инфраструктура
just local-up

# 2. Миграции
just migrate

# 3. Бэкенд (отдельные терминалы)
just run users
just run admin
just run-gateway

# 4. Фронтенд (отдельный терминал)
cd frontend && npm start
```

| Компонент | URL |
|-----------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| Kafka | localhost:9092 |

### Полный Docker-стек

Все сервисы в контейнерах. Наружу доступен только API Gateway.

```bash
# Поднять
just up
# или: docker compose up -d

# Остановить
just down
# или: docker compose down
```

API Gateway: `http://localhost:8080`

### Production (Traefik + SSL)

```bash
# Настроить домены в .env
ACME_EMAIL=your-email@example.com
FRONTEND_DOMAIN=app.yourdomain.com
API_DOMAIN=api.yourdomain.com

# Запустить
docker compose -f docker-compose.prod.yaml up -d
```

Включает:
- Traefik с автоматическим SSL (Let's Encrypt)
- HTTP → HTTPS редирект
- Frontend (React build → nginx)
- API Gateway (nginx)
- PostgreSQL, Kafka, Redis — во внутренней сети

---

## База данных и миграции

### Применить миграции

```bash
just migrate
```

### Создать новую миграцию

```bash
just migrate-new "описание миграции"
# или: alembic revision --autogenerate -m "описание"
```

### Пересоздать БД с нуля

```bash
just db-recreate
```

Это сделает: `docker compose down -v` → поднимет `db` → `alembic upgrade head`.

### Прямое подключение к БД

```bash
docker exec -it $(docker compose -f docker-compose.local.yml ps -q db) \
  psql -U app -d audit_trail_db
```

---

## Фронтенд

### Установка зависимостей

```bash
cd frontend
npm ci
```

### Разработка

```bash
npm start           # Dev-сервер на :3000 с hot reload
```

### Сборка

```bash
npm run build       # Production-сборка в build/
```

### Docker-образ

```bash
docker build -t rsd-frontend ./frontend
docker run -p 3000:80 rsd-frontend
```

### Стек фронтенда

| Пакет | Версия |
|-------|--------|
| react | 19.1 |
| react-router | 7.8 |
| @reduxjs/toolkit | 2.8 |
| axios | 1.12 |
| classnames | 2.5 |

---

## Тестирование

### Запуск тестов одного сервиса

```bash
just test users
just test admin
```

Тесты используют `config.test.yaml` и `pytest`.

### Запуск всех тестов

```bash
just test-all
```

### CI

В репозитории настроен GitHub Actions (`.github/workflows/ci.yaml`), использующий `docker-compose.ci.yaml` для поднятия тестовой БД.

---

## Kafka и S3

Модули для работы с Kafka и S3 находятся в `backend/shared/kafka_streams/` и `backend/shared/storage/`.

### Kafka

- Топики описаны в `kafka_streams/topics.py`
- Consumer-декоратор: `@kafka_subscriber(topic)` в `consumer.py`
- Producer: `kafka_streams/producer.py`
- Запуск Kafka/consumers — через `start_kafka` / `stop_kafka` в lifespan приложения

### S3

- Клиент: `storage/s3_client.py`
- Загрузка файлов через Kafka-подписчики (subscribers)

Для подключения Kafka/S3 в сервисе добавьте секции `kafka` и `s3` в `config.yaml` (см. `config.example.yaml`).

---

## Справочник just-команд

| Команда | Описание |
|---------|----------|
| `just local-up` | Поднять DB + Kafka (docker-compose.local.yml) |
| `just local-down` | Остановить локальную инфраструктуру |
| `just migrate` | Применить миграции Alembic |
| `just migrate-new "msg"` | Создать новую миграцию (autogenerate) |
| `just db-recreate` | Пересоздать БД с нуля |
| `just venv <service>` | Создать .venv и установить зависимости для сервиса |
| `just venv-all` | Создать .venv для всех сервисов |
| `just deps <service>` | Установить зависимости в текущее окружение |
| `just deps-all` | Установить зависимости всех сервисов |
| `just run <service>` | Запустить сервис локально (ожидает DB) |
| `just run-gateway` | Запустить API Gateway локально |
| `just test <service>` | Запустить тесты одного сервиса |
| `just test-all` | Запустить тесты всех сервисов |
| `just up` | Поднять полный Docker-стек |
| `just down` | Остановить полный Docker-стек |

**Доступные сервисы для `just run` / `just venv` / `just test`:** `users`, `admin`, `api_gateway`

---

## Документация

| Документ | Описание |
|----------|----------|
| [docs/ROLE_MODEL.md](docs/ROLE_MODEL.md) | Ролевая модель (8 ролей, матрица доступа) |
| [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) | ТЗ на дизайн UI/UX |
| [docs/ТЗ блок базы знаний.docx](docs/ТЗ%20блок%20базы%20знаний.docx) | ТЗ по модулю базы знаний |
| [.cursor/rules/PROJECT.md](.cursor/rules/PROJECT.md) | Правила проекта и конвенции |
| [.cursor/rules/frontend/TEMPLATE_ARCHITECTURE.md](.cursor/rules/frontend/TEMPLATE_ARCHITECTURE.md) | Архитектурный шаблон фронтенда |

---

## Troubleshooting

### Порт 5432 занят

Если на хосте уже запущен PostgreSQL:

```bash
# Остановить системный postgres (macOS)
brew services stop postgresql

# Или изменить порт в docker-compose.local.yml
ports:
  - "5433:5432"
```

### Kafka не стартует

Kafka требует ~15 секунд на инициализацию. Проверьте healthcheck:

```bash
docker compose -f docker-compose.local.yml logs kafka
```

### Миграции падают с ошибкой подключения

Убедитесь, что DB поднята и доступна:

```bash
docker compose -f docker-compose.local.yml ps db
# Статус должен быть healthy
```

Проверьте `DATABASE_URL`:

```bash
export DATABASE_URL=postgresql+asyncpg://app:appsecret@localhost:5432/audit_trail_db
alembic upgrade head
```

### Frontend не видит API

Убедитесь, что API Gateway запущен на `:8080` и в фронтенде настроен правильный `baseURL` (см. `frontend/src/api/APIClient.js`).
