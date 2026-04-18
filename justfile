backend_dir := "backend"
db_url := env_var_or_default("DATABASE_URL", "postgresql+asyncpg://app:appsecret@localhost:5432/rsd_db")
test_db_url := env_var_or_default("DATABASE_URL", "postgresql+asyncpg://app:appsecret@localhost:5432/rsd_test_db")
compose_local := "docker-compose.local.yml"
compose_prod := "docker-compose.prod.yaml"
compose_ci := "docker-compose.ci.yaml"


deps:
    pip install -r {{backend_dir}}/requirements.txt

venv:
    set -euo pipefail
    VENV="{{backend_dir}}/.venv"
    if [ ! -d "$VENV" ]; then
      python3 -m venv "$VENV"
      echo "Создан $VENV"
    fi
    "$VENV/bin/pip" install -r {{backend_dir}}/requirements.txt
    echo "Зависимости установлены"


test *args:
    DATABASE_URL="{{test_db_url}}" \
    CONFIG_PATH="{{backend_dir}}/shared/settings/config.test.yaml" \
    pytest {{args}}

test-cov:
    DATABASE_URL="{{test_db_url}}" \
    CONFIG_PATH="{{backend_dir}}/shared/settings/config.test.yaml" \
    pytest --cov={{backend_dir}} --cov-report=term-missing

test-ci:
    docker compose -f {{compose_ci}} up -d
    @sleep 3
    DATABASE_URL="{{test_db_url}}" \
    CONFIG_PATH="{{backend_dir}}/shared/settings/config.test.yaml" \
    pytest -v --tb=short
    docker compose -f {{compose_ci}} down --remove-orphans


local-up:
    docker compose -f {{compose_local}} up -d

local-down:
    docker compose -f {{compose_local}} down

run:
    #!/usr/bin/env bash
    set -euo pipefail
    cd {{backend_dir}} && \
    PYTHONPATH=. DATABASE_URL="{{db_url}}" \
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload


up:
    docker compose -f {{compose_prod}} up -d

down:
    docker compose -f {{compose_prod}} down

    
migrate:
    DATABASE_URL="{{db_url}}" alembic upgrade head

migrate-new message:
    alembic revision --autogenerate -m "{{message}}"

db-recreate:
    docker compose -f {{compose_local}} down -v
    docker compose -f {{compose_local}} up -d db
    @sleep 5
    DATABASE_URL="{{db_url}}" alembic upgrade head
    @echo "БД пересоздана, миграции применены."
