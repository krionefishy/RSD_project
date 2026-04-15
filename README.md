# Робин Сдобин — Мобильный кабинет продавца

Корпоративная платформа для сети пекарен «Робин Сдобин»: обучение персонала, отслеживание продаж, рейтинги и мотивация.

## Фирменный стиль

Приложение выполнено в фирменных цветах бренда «Робин Сдобин»:

| Цвет | HEX | Использование |
|------|-----|---------------|
| 🟢 Зелёный (лес) | `#2E7D32` | Основной, заголовки, кнопки |
| 🟡 Золотой (выпечка) | `#F5A623` | Акценты, иконки, графики |
| 🔴 Ягодный | `#C41E3A` | Вторичный акцент, важные действия |
| 🟤 Кремовый фон | `#FFF8F0` | Фон приложения |

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4, Jotai (PWA) |
| Backend | Python 3.12+, FastAPI, SQLAlchemy (async), **модульный монолит** |
| БД | PostgreSQL 15+ |
| Миграции | Alembic (единые для всей БД) |
| Очереди | Apache Kafka (фоновые задачи) |
| Кэш | Redis 7 |
| Хранилище | S3 (через Kafka-подписчики) |
| Reverse Proxy | **Traefik** (единый entrypoint, SSL через Let's Encrypt) |
| Контейнеризация | Docker, Docker Compose |

> **Архитектура Backend:** см. [docs/BACKEND_ARCHITECTURE.md](docs/BACKEND_ARCHITECTURE.md) — модульный монолит с usecases, DI, Kafka для фоновых задач.

---

## Структура репозитория

```
RSD/
├── backend/                       # Модульный монолит (FastAPI)
│   ├── app/
│   │   ├── main.py                #   Точка входа FastAPI
│   │   ├── api/router.py          #   Корневой роутер API
│   │   ├── shared/                #   Общие модули
│   │   │   ├── settings/          #     Pydantic Settings + YAML
│   │   │   ├── di/                #     DI контейнер
│   │   │   ├── auth/              #     JWT, middleware
│   │   │   ├── errors/            #     Исключения, обработчики
│   │   │   └── db/                #     SQLAlchemy session
│   │   ├── knowledge_base/        #   Домен: База знаний
│   │   │   ├── api/               #     Routes (tests, materials, courses)
│   │   │   ├── usecases/          #     Бизнес-логика + транзакции
│   │   │   ├── domain.py          #     Pydantic входные модели
│   │   │   ├── dto.py             #     Pydantic выходные модели
│   │   │   └── db_models.py       #     SQLAlchemy ORM
│   │   ├── users/                 #   Домен: Пользователи
│   │   ├── sellings/              #   Домен: Продажи
│   │   └── admin/                 #   Домен: Администрирование
│   ├── storage/                   # Инфраструктурные адаптеры
│   │   ├── pg/                    #   PostgreSQL base
│   │   ├── migrations/            #   Alembic миграции
│   │   ├── s3/                    #   S3 клиент
│   │   └── redis/                 #   Redis клиент
│   ├── streams/                   # Kafka инфраструктура
│   │   ├── kafka/                 #   Producer, Consumer
│   │   ├── subscribers/           #   Обработчики событий
│   │   └── topics.py              #   Константы топиков
│   ├── Dockerfile                 #   Backend Dockerfile
│   └── requirements.txt           #   Python зависимости
├── frontend/                      # React PWA
│   ├── public/                    #   manifest.json, service-worker, index.html
│   ├── src/                       #   pages/, components/, api/, features/, etc.
│   ├── Dockerfile                 #   Multi-stage: node build → nginx
│   └── nginx.conf                 #   SPA-конфигурация
├── docs/                          # Документация и ТЗ
│   ├── ROLE_MODEL.md              #   Ролевая модель
│   ├── DESIGN_BRIEF.md            #   ТЗ на дизайн
│   ├── BACKEND_ARCHITECTURE.md    #   Архитектура backend (монолит)
│   └── ТЗ блок базы знаний.docx
├── docker-compose.yml             # Полный стек (все сервисы)
├── docker-compose.local.yml       # Локальная разработка (только DB + Kafka)
├── docker-compose.prod.yaml       # Production (Traefik + SSL)
├── docker-compose.ci.yaml         # CI (только тестовая БД)
├── alembic.ini                    # Конфигурация Alembic
├── justfile                       # Сценарии автоматизации
├── .env.example                   # Шаблон переменных окружения
└── .github/workflows/ci.yaml      # GitHub Actions CI
```

### Структура бэкенд-монолита (модульный)

```
backend/app/
├── main.py                        # FastAPI app, lifespan, CORS
├── api/router.py                  # Корневой роутер, include всех доменов
├── shared/                        # Общие модули
│   ├── settings/                  #   Pydantic Settings + YAML config
│   ├── di/container.py            #   DI контейнер (зависимости)
│   ├── auth/                      #   JWT, middleware
│   ├── errors/                    #   Кастомные исключения
│   └── db/session.py              #   SQLAlchemy engine + sessionmaker
├── knowledge_base/                # Домен: База знаний
│   ├── api/                       #   Routes (tests, materials, courses)
│   ├── usecases/                  #   Бизнес-логика + транзакции
│   ├── domain.py                  #   Входные Pydantic модели
│   ├── dto.py                     #   Выходные Pydantic модели
│   └── db_models.py               #   SQLAlchemy ORM модели
├── users/                         # Домен: Пользователи
├── sellings/                      # Домен: Продажи
└── admin/                         # Домен: Администрирование
```

**Правила слоев:**
1. **API** (`api/routes.py`): принимает запрос, валидирует `domain`, вызывает usecase, возвращает `dto`
2. **Usecases** (`usecases/`): бизнес-логика, работа с БД, **транзакции** (`commit`/`rollback`)
3. **Domain** (`domain.py`): входные Pydantic модели (валидация)
4. **DTO** (`dto.py`): выходные Pydantic модели (ответы API)
5. **DB Models** (`db_models.py`): SQLAlchemy ORM

**Транзакции:**
- `commit()` — при успехе usecase
- `rollback()` — при любой ошибке
- Только чтение — без `commit`

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

### 3. Конфигурация бэкенда

Бэкенд использует переменные окружения или YAML конфиг. Создайте `.env` или скопируйте конфиг:

```bash
# Вариант 1: Переменные окружения
export DATABASE_URL="postgresql+asyncpg://app:appsecret@localhost:5432/rsd_db"
export KAFKA_BOOTSTRAP_SERVERS="localhost:9092"
export REDIS_HOST="localhost"

# Вариант 2: YAML конфиг (опционально)
cp backend/app/shared/settings/config.yaml.example backend/app/shared/settings/config.yaml
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
# Установить зависимости
cd backend && pip install -r requirements.txt

# Запустить backend
just run-backend       # или: uvicorn app.main:app --reload --port 8000
```

Backend будет доступен на `http://localhost:8000`  
Health check: `http://localhost:8000/health`

#### Вариант B: вручную

```bash
# Установить зависимости
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Запустить
export DATABASE_URL="postgresql+asyncpg://app:appsecret@localhost:5432/rsd_db"
export KAFKA_BOOTSTRAP_SERVERS="localhost:9092"
export REDIS_HOST="localhost"
uvicorn app.main:app --reload --port 8000
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

Инфраструктура в Docker, backend и фронтенд — на хосте.

```bash
# 1. Инфраструктура
just local-up

# 2. Миграции
just migrate

# 3. Бэкенд
just run-backend

# 4. Фронтенд (отдельный терминал)
cd frontend && npm start
```

| Компонент | URL |
|-----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| PostgreSQL | localhost:5432 |
| Kafka | localhost:9092 |

### Полный Docker-стек

Все сервисы в контейнерах.

```bash
# Поднять
just up
# или: docker compose up -d

# Остановить
just down
# или: docker compose down
```

Backend: `http://localhost:8000`

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
- Traefik с автоматическим SSL (Let's Encrypt) — единственный внешний порт
- HTTP → HTTPS редирект
- Frontend (React build → nginx)
- Backend (FastAPI)
- PostgreSQL, Kafka, Redis — во **внутренней** сети (недоступны снаружи)

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
| `just run-backend` | Запустить backend локально (ожидает DB) |
| `just test` | Запустить тесты backend |
| `just up` | Поднять полный Docker-стек |
| `just down` | Остановить полный Docker-стек |

---

## Документация

| Документ | Описание |
|----------|----------|
| [docs/ROLE_MODEL.md](docs/ROLE_MODEL.md) | Ролевая модель (7 ролей, матрица доступа) |
| [docs/BACKEND_ARCHITECTURE.md](docs/BACKEND_ARCHITECTURE.md) | Архитектура backend (модульный монолит) |
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

Убедитесь, что backend запущен на `:8000` и в фронтенде настроен правильный `baseURL` (см. `frontend/src/api/APIClient.js`).

Для локальной разработки настройте CORS в `backend/app/main.py`:
```python
allow_origins=["http://localhost:5173"]  # Vite dev server
```
