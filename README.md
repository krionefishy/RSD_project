# BOWSell Audit Trail — ОКК (Отделы контроля качества)

Сервис для автоматизации работы отделов контроля качества: ведение журналов аудитов, назначение проверок предприятиям, аналитика по объектам и др.

Монорепозиторий: шаблон проекта по ТЗ «BOWSell Audit Trail» (журналы аудитов и отчётность ОКК).

## Стек (по ТЗ)

- **Frontend:** PWA на React
- **Backend:** микросервисы на Python 3.12+, FastAPI, SQLAlchemy (async), единая БД PostgreSQL 15+
- **Миграции:** Alembic (общие для всей БД)
- **Взаимодействие:** API Gateway (единая точка входа), между сервисами — HTTP и при необходимости Apache Kafka

## Структура монорепо

```
Audit_trail_prj/
├── backend/                    # Бэкенд
│   ├── shared/                 # Общий код: Base, Database
│   ├── users_service/         # Пользователи, роли, профили, 2FA, привязка к ОКК
│   ├── checklists_service/    # Чек-листы, шаблоны, проведённые аудиты
│   ├── reports_service/      # Отчёты по аудитам, выгрузка xlsx/pdf
│   ├── organizations_service/ # ОКК, объекты проверки, менеджеры
│   ├── admin_service/         # Админка (чек-листы, сотрудники, объекты, аналитика)
│   └── api_gateway/           # Маршрутизация, аутентификация
├── frontend/                   # PWA (React) — заглушка
├── migrations/                 # Alembic, единая БД
├── docker-compose.yml
└── README.md
```

У каждого микросервиса: свой `config.yaml`, свой `requirements.txt`, свои тесты в `tests/`, класс `Application` в стиле Barista_KPI (db, store с аксессорами, без сервисного слоя — endpoints обращаются к `store.*_accessor`).

## Запуск (Docker)

Из корня репозитория:

```bash
docker compose up -d
```

**Сеть:** наружу смотрит только API Gateway. БД и микросервисы доступны только внутри Docker-сети.

- **Единственная точка входа:** `http://localhost:8080` (API Gateway)
- БД и сервисы (users, checklists, reports, organizations, admin) с хоста не видны; Gateway обращается к ним по именам сервисов (`users_service:8000` и т.д.)

Миграции с хоста: запускать в контейнере в той же сети (например, `docker compose run --rm api_gateway ...`) или временно пробросить порт БД в `docker-compose` при необходимости.

## Миграции (Alembic, как в Barista_KPI_project)

Из корня репозитория (`alembic.ini` в корне, `script_location = migrations`):

```bash
export DATABASE_URL=postgresql+asyncpg://app:appsecret@localhost:5432/audit_trail_db
alembic upgrade head
```

Создание новой миграции:

```bash
alembic revision --autogenerate -m "описание"
```

## Локальный запуск сервиса (без Docker)

Из корня:

```bash
cd backend
export PYTHONPATH=.
export CONFIG_PATH=users_service/config.yaml
export DATABASE_URL=postgresql://app:appsecret@localhost:5432/audit_trail_db
python users_service/main.py
```

Аналогично для `checklists_service/main.py` и остальных (порты в config.yaml).

## Тесты

В каждом сервисе папка `tests/` с заглушкой. Запуск (пример для users):

```bash
cd backend
pip install -r users_service/requirements.txt pytest pytest-asyncio
PYTHONPATH=. pytest users_service/tests/ -v
```
