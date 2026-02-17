# BOWSell Audit Trail — сценарии (just)
# Требуется: https://github.com/casey/just

Установка just:

linux: sudo apt install just

macos: brew install just

Windows: не уважаемо


# Переменные по умолчанию (переопределяются через .env или export)
backend_dir := "backend"
db_url := env_var_or_default("DATABASE_URL", "postgresql+asyncpg://app:appsecret@localhost:5432/audit_trail_db")
compose_file := env_var_or_default("COMPOSE_FILE", "docker-compose.yml")
compose_local := "docker-compose.local.yml"

# Список микросервисов (кроме api_gateway — без БД; storage — без БД, только S3+Kafka)
services := ["users", "checklists", "reports", "organizations", "admin", "storage"]
services_with_deps := ["users", "checklists", "reports", "organizations", "admin", "storage", "api_gateway"]

# Запуск тестов по одному сервису (PYTHONPATH: backend + backend/<service>_service для app и shared)
# Использует .venv сервиса, если есть (pytest оттуда)
test service:
    set -euo pipefail
    SVC="{{service}}_service"
    DIR="{{backend_dir}}/$SVC"
    CONFIG="$DIR/config.test.yaml"
    [ -f "$CONFIG" ] || CONFIG="$DIR/config.yaml"
    if [ -x "$DIR/.venv/bin/pytest" ]; then
      PYTEST="$DIR/.venv/bin/pytest"
    else
      PYTEST=pytest
    fi
    cd {{backend_dir}} && \
    PYTHONPATH=.:$SVC CONFIG_PATH="$CONFIG" DATABASE_URL="{{db_url}}" \
    $PYTEST $SVC/tests/ -v --tb=short

# Запуск тестов по всем микросервисам
test-all:
    just test users
    just test checklists
    just test reports
    just test organizations
    just test admin

# Создать venv для одного микросервиса и установить зависимости
# Для api_gateway каталог — backend/api_gateway, для остальных — backend/<service>_service
venv service:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ "{{service}}" = "api_gateway" ]; then
      SVC="api_gateway"
      DIR="{{backend_dir}}/api_gateway"
    else
      SVC="{{service}}_service"
      DIR="{{backend_dir}}/$SVC"
    fi
    VENV="$DIR/.venv"
    if [ ! -d "$VENV" ]; then
      python3 -m venv "$VENV"
      echo "Создан $VENV"
    fi
    "$VENV/bin/pip" install -r "$DIR/requirements.txt"
    echo "Зависимости установлены: $SVC"

# Создать venv для каждого микросервиса и установить зависимости
venv-all:
    just venv users
    just venv checklists
    just venv reports
    just venv organizations
    just venv admin
    just venv api_gateway

# Обновление зависимостей одного сервиса (в текущее окружение или в venv сервиса)
deps service:
    pip install -r {{backend_dir}}/{{service}}_service/requirements.txt

# Обновление зависимостей всех сервисов
deps-all:
    for svc in {{services_with_deps}}; do just deps $$svc; done

# Пересоздание БД: остановить контейнеры, удалить volume, поднять db, применить миграции
db-recreate:
    docker compose -f {{compose_file}} down -v
    docker compose -f {{compose_file}} up -d db
    @sleep 5
    DATABASE_URL="{{db_url}}" alembic upgrade head
    @echo "БД пересоздана, миграции применены."

# Локальный запуск: поднять только db (и при необходимости kafka) по docker-compose.local
local-up:
    docker compose -f {{compose_local}} up -d

local-down:
    docker compose -f {{compose_local}} down

# Запуск одного микросервиса локально (без Docker). Для сервисов с БД — ожидается db (local-up). storage — ожидается kafka.
# Использует .venv сервиса, если есть (после just venv <service>)
run service:
    #!/usr/bin/env bash
    set -euo pipefail
    SVC="{{service}}_service"
    DIR="{{backend_dir}}/$SVC"
    CONFIG="$DIR/config.yaml"
    [ -f "$CONFIG" ] || { echo "Создайте $CONFIG из config.example.yaml"; exit 1; }
    if [ -x "$DIR/.venv/bin/python" ]; then
      PY="$DIR/.venv/bin/python"
    else
      PY=python
    fi
    cd {{backend_dir}} && \
    PYTHONPATH=.:$SVC CONFIG_PATH="$CONFIG" DATABASE_URL="{{db_url}}" \
    $PY $SVC/main.py

# Запуск API Gateway локально (использует api_gateway/.venv при наличии)
run-gateway:
    #!/usr/bin/env bash
    set -euo pipefail
    DIR="{{backend_dir}}/api_gateway"
    CONFIG="$DIR/config.yaml"
    [ -f "$CONFIG" ] || { echo "Создайте $CONFIG из config.example.yaml"; exit 1; }
    [ -x "$DIR/.venv/bin/python" ] && PY="$DIR/.venv/bin/python" || PY=python
    cd {{backend_dir}} && PYTHONPATH=. CONFIG_PATH="$CONFIG" $PY api_gateway/main.py

# Полный стек через основной docker-compose (production-like)
up:
    docker compose -f {{compose_file}} up -d

down:
    docker compose -f {{compose_file}} down

# Применить миграции (из корня репозитория)
migrate:
    DATABASE_URL="{{db_url}}" alembic upgrade head

migrate-new message:
    alembic revision --autogenerate -m "{{message}}"
