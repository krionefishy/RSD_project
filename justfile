# Command groups: local dev | database | CI | deploy | frontend — see scripts/JUSTFILE_REVIEW.md
set dotenv-load

compose_file := "docker-compose.local.yml"
compose := "docker compose -f " + compose_file

deploy_env_file := "deploy/.env.production"
compose_prod := "docker compose --env-file " + deploy_env_file + " -f deploy/docker-compose.yaml"
compose_demo := "docker compose --env-file " + deploy_env_file + " -f deploy/docker-compose.demo.yaml"
compose_demo1 := "docker compose --env-file " + deploy_env_file + " -f deploy/docker-compose.demo1.yaml"

backend_dir := "backend"
app_module := "app.main:app"
backend_config_path := "shared/settings/config.yaml"
test_config_path := backend_dir + "/shared/settings/config.test.yaml"
demo_config_path := backend_dir + "/shared/settings/config.demo.yaml"
python := env_var_or_default("PYTHON", backend_dir + "/venv/bin/python")

export PGHOST := env_var_or_default("LOCAL_PGHOST", "localhost")
export PGPORT := env_var_or_default("LOCAL_PGPORT", "5437")
export PGUSER := env_var_or_default("DB_USER", "app")
export PGPASSWORD := env_var_or_default("DB_PASSWORD", "appsecret")
export PGDATABASE := env_var_or_default("DB_NAME", "rsd_db")
export TEST_PGHOST := env_var_or_default("LOCAL_TEST_PGHOST", "localhost")
export TEST_PGPORT := env_var_or_default("LOCAL_TEST_PGPORT", "5433")
export TEST_PGDATABASE := env_var_or_default("LOCAL_TEST_PGDATABASE", "rsd_test_db")

export DATABASE_URL := env_var_or_default(
    "LOCAL_DATABASE_URL",
    "postgresql+asyncpg://" + PGUSER + ":" + PGPASSWORD + "@" + PGHOST + ":" + PGPORT + "/" + PGDATABASE,
)
export TEST_DATABASE_URL := env_var_or_default(
    "LOCAL_TEST_DATABASE_URL",
    "postgresql+asyncpg://" + PGUSER + ":" + PGPASSWORD + "@" + TEST_PGHOST + ":" + TEST_PGPORT + "/" + TEST_PGDATABASE,
)

[doc('Show available tasks')]
default:
    @just --list

[private]
_docker:
    @docker info >/dev/null

[doc('Start Postgres container')]
pg-up: _docker
    {{ compose }} up -d db

[doc('Start test Postgres container')]
pg-up-test: _docker
    {{ compose }} up -d db_test

[doc('Start local infrastructure: Postgres, Redis and Kafka')]
infra-up: _docker
    {{ compose }} up -d

[doc('Stop local infrastructure')]
infra-down: _docker
    {{ compose }} down

[doc('Stop local infrastructure and remove volumes')]
infra-clean: _docker
    {{ compose }} down -v

[doc('Show local infrastructure status')]
infra-status: _docker
    {{ compose }} ps

[doc('Follow local infrastructure logs')]
infra-logs service="":
    {{ compose }} logs -f {{ service }}

[doc('Wait until Postgres is ready')]
pg-wait: pg-up
    @for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do if {{ compose }} exec -T db pg_isready -U {{ PGUSER }} -d {{ PGDATABASE }} >/dev/null 2>&1; then echo "Postgres is ready"; exit 0; fi; sleep 1; done; {{ compose }} logs --tail=50 db; exit 1

[doc('Wait until test Postgres is ready')]
pg-wait-test: pg-up-test
    @for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do if {{ compose }} exec -T db_test pg_isready -U {{ PGUSER }} -d {{ TEST_PGDATABASE }} >/dev/null 2>&1; then echo "Test Postgres is ready"; exit 0; fi; sleep 1; done; {{ compose }} logs --tail=50 db_test; exit 1


[doc('Create development database')]
db-create: pg-wait
    @{{ compose }} exec -T db createdb -U {{ PGUSER }} {{ PGDATABASE }} 2>/dev/null || true

[doc('Drop development database')]
db-drop: pg-up
    @{{ compose }} exec -T db dropdb -U {{ PGUSER }} --if-exists --force {{ PGDATABASE }}

[doc('Reset development database')]
db-reset: db-drop db-create

[doc('Create test database')]
db-create-test: pg-wait-test
    @{{ compose }} exec -T db_test createdb -U {{ PGUSER }} {{ TEST_PGDATABASE }} 2>/dev/null || true

[doc('Drop test database')]
db-drop-test: pg-up-test
    @{{ compose }} exec -T db_test dropdb -U {{ PGUSER }} --if-exists --force {{ TEST_PGDATABASE }}

[doc('Reset test database')]
db-reset-test: db-drop-test db-create-test

[doc('Apply migrations to development database')]
db-migrate: db-create
    DATABASE_URL={{ DATABASE_URL }} {{ python }} -m alembic upgrade head

[doc('Alias for db-migrate')]
migrate: db-migrate

[doc('Reset DB, migrate and seed Demo 1 demonstration data (Этап 6 scope)')]
demo1-seed: db-migrate
    CONFIG_PATH={{ demo_config_path }} DATABASE_URL={{ DATABASE_URL }} {{ python }} scripts/seed_demo1.py

[doc('Local Demo 1 prep: infra up, DB rebuild, Demo 1 seed')]
demo1-setup: infra-up db-rebuild
    CONFIG_PATH={{ demo_config_path }} DATABASE_URL={{ DATABASE_URL }} {{ python }} scripts/seed_demo1.py

[doc('Apply report_service database migrations (demo config)')]
report-db-migrate:
    cd {{ backend_dir }}/report_service && env -u DATABASE_URL CONFIG_PATH=../shared/settings/config.demo.yaml PYTHONPATH=.. {{ python }} -m alembic upgrade head

[doc('Start full Demo 1 locally: infra, migrate, seed, backend, report_service, UI')]
demo1-local *args:
    ./scripts/demo1-local.sh {{ args }}

[doc('Reset DB and seed full demo dataset (incl. knowledge base); demo config only')]
seed-demo: db-migrate
    cd {{ backend_dir }} && CONFIG_PATH=shared/settings/config.demo.yaml DATABASE_URL={{ DATABASE_URL }} {{ python }} -m scripts.seed_demo

[doc('Apply migrations to test database (rebuilds DB if alembic revision is missing)')]
db-migrate-test: db-create-test
    @DATABASE_URL='{{ TEST_DATABASE_URL }}' '{{ python }}' -m alembic upgrade head || (echo "Test DB schema out of sync, rebuilding..." && just db-rebuild-test)

[doc('Reset development database and apply migrations')]
db-rebuild: db-reset db-migrate

[doc('Reset test database and apply migrations')]
db-rebuild-test: db-reset-test
    DATABASE_URL={{ TEST_DATABASE_URL }} {{ python }} -m alembic upgrade head

[doc('Create a new autogenerated migration')]
migration message:
    DATABASE_URL={{ DATABASE_URL }} {{ python }} -m alembic revision --autogenerate -m "{{ message }}"

[doc('Show database connection info')]
db-info:
    @echo "Development DB: {{ DATABASE_URL }}"
    @echo "Test DB:        {{ TEST_DATABASE_URL }}"


[doc('Install backend dependencies')]
install:
    cd {{ backend_dir }} && pip install -r requirements.txt

[doc('Run backend with auto reload')]
backend:
    cd {{ backend_dir }} && CONFIG_PATH={{ backend_config_path }} {{ python }} -m uvicorn {{ app_module }} --reload --host 0.0.0.0 --port 8000

[doc('Alias for backend')]
dev: backend

[doc('Run backend without reload')]
serve:
    cd {{ backend_dir }} && CONFIG_PATH={{ backend_config_path }} {{ python }} -m uvicorn {{ app_module }} --host 0.0.0.0 --port 8000

[doc('Run backend tests')]
test *args: db-migrate-test
    CONFIG_PATH={{ test_config_path }} DATABASE_URL={{ TEST_DATABASE_URL }} {{ python }} -m pytest {{ args }}

[doc('Run backend tests with coverage')]
test-cov *args: db-migrate-test
    CONFIG_PATH={{ test_config_path }} DATABASE_URL={{ TEST_DATABASE_URL }} {{ python }} -m pytest --cov=backend/app --cov-report=term-missing --cov-report=html {{ args }}

[doc('Run tests matching pytest -k expression')]
test-k pattern *args: db-migrate-test
    CONFIG_PATH={{ test_config_path }} DATABASE_URL={{ TEST_DATABASE_URL }} {{ python }} -m pytest -k "{{ pattern }}" {{ args }}

[doc('Run Demo 1 smoke tests')]
smoke *args: db-migrate-test
    CONFIG_PATH={{ test_config_path }} DATABASE_URL={{ TEST_DATABASE_URL }} {{ python }} -m pytest -m smoke {{ args }}

[doc('Reset test database and run tests')]
test-reset *args: db-rebuild-test
    CONFIG_PATH={{ test_config_path }} DATABASE_URL={{ TEST_DATABASE_URL }} {{ python }} -m pytest {{ args }}

[doc('Apply migrations in CI (DATABASE_URL must be set in environment)')]
ci-migrate:
    DATABASE_URL={{ env_var("DATABASE_URL") }} {{ python }} -m alembic upgrade head

[doc('Run backend tests with coverage in CI (DATABASE_URL must be set)')]
ci-test-run:
    CONFIG_PATH={{ test_config_path }} DATABASE_URL={{ env_var("DATABASE_URL") }} {{ python }} -m pytest --cov=backend --cov-report=term-missing

[doc('CI pipeline: migrations then tests with coverage')]
ci-test: ci-migrate ci-test-run

[doc('Run all checks without modifying files')]
lint: ruff format-check mypy

[doc('Run ruff linter')]
ruff:
    {{ python }} -m ruff check backend

[doc('Check formatting')]
format-check:
    {{ python }} -m ruff format --check backend

[doc('Format backend code')]
fmt:
    {{ python }} -m ruff format backend

[doc('Apply safe ruff fixes')]
lint-fix:
    {{ python }} -m ruff check backend --fix

[doc('Run mypy type checks')]
mypy:
    {{ python }} -m mypy backend/app backend/tests --show-traceback



[doc('Generate backend/shared/settings/config.production.yaml with random secrets')]
deploy-secrets:
    ./deploy/generate-production-secrets.sh

[doc('Start presentation demo on server (nginx + frontend, mock data)')]
deploy-demo-up: _docker
    {{ compose_demo }} up -d --build

[doc('Stop presentation demo stack (project rsd-demo)')]
deploy-demo-down: _docker
    {{ compose_demo }} down --remove-orphans

[doc('Show presentation demo stack status')]
deploy-demo-status: _docker
    {{ compose_demo }} ps

[doc('Follow presentation demo logs (optional service: nginx, frontend)')]
deploy-demo-logs service="":
    {{ compose_demo }} logs -f {{ service }}

[doc('Rebuild and restart presentation demo')]
deploy-demo-rebuild: _docker
    {{ compose_demo }} up -d --build --force-recreate

[doc('Start Demo 1 stack (backend + frontend_demos partial mock)')]
deploy-demo1-up: _docker
    {{ compose_demo1 }} up -d --build

[doc('Stop Demo 1 stack (project rsd-demo1)')]
deploy-demo1-down: _docker
    {{ compose_demo1 }} down --remove-orphans

[doc('Show Demo 1 stack status')]
deploy-demo1-status: _docker
    {{ compose_demo1 }} ps

[doc('Follow Demo 1 logs (optional service: nginx, backend, frontend, ...)')]
deploy-demo1-logs service="":
    {{ compose_demo1 }} logs -f {{ service }}

[doc('Rebuild and restart Demo 1 stack')]
deploy-demo1-rebuild: _docker
    {{ compose_demo1 }} up -d --build --force-recreate

[doc('Start full production stack (nginx + frontend + backend + db + redis + kafka)')]
deploy-prod-up: _docker
    {{ compose_prod }} up -d --build

[doc('Stop full production stack')]
deploy-prod-down: _docker
    {{ compose_prod }} down --remove-orphans

[doc('Show production stack status')]
deploy-prod-status: _docker
    {{ compose_prod }} ps

[doc('Follow production logs (optional service: nginx, backend, db, ...)')]
deploy-prod-logs service="":
    {{ compose_prod }} logs -f {{ service }}

[doc('Rebuild and restart production stack')]
deploy-prod-rebuild: _docker
    {{ compose_prod }} up -d --build --force-recreate

[doc('Stop demo, demo1 and production deploy stacks (free ports 80/443)')]
deploy-down-all: _docker
    {{ compose_prod }} down --remove-orphans 2>/dev/null || true
    {{ compose_demo }} down --remove-orphans 2>/dev/null || true
    {{ compose_demo1 }} down --remove-orphans 2>/dev/null || true
    @echo "Deploy stacks stopped."

[doc('Run frontend locally in presentation mode (Vite, mock APIs)')]
frontend-demo:
    cd frontend && npm run dev:demo

[doc('Run Demo 1 UI locally (frontend_demos, partial mock)')]
frontend-demo1:
    cd frontend_demos && npm run dev
