# Миграции Alembic — единая БД

Все микросервисы подключаются к одной PostgreSQL. Миграции общие, структура таблиц разбита по доменам (users, checklists, reports, organizations, admin) и согласована на уровне проекта.

Конфиг: `alembic.ini` в корне репозитория, `script_location = migrations`.

Запуск из корня монорепо:
  export DATABASE_URL=postgresql+asyncpg://app:appsecret@localhost:5432/audit_trail_db
  alembic upgrade head

Создание новой миграции:
  alembic revision --autogenerate -m "описание"

Используется async-движок (create_async_engine), compare_type=True, при наличии — load_dotenv().
