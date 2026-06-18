# Command groups: local dev | database | CI | deploy | frontend — see scripts/JUSTFILE_REVIEW.md
set dotenv-load

compose_file := "docker-compose.local.yml"
compose := "docker compose -f " + compose_file

compose_prod    := "docker compose -f deploy/docker-compose.yaml"
compose_demo1   := "docker compose -f deploy/docker-compose.demo1.yaml"
compose_gateway := "docker compose -f deploy/docker-compose.gateway.yaml"

backend_dir := "backend"
app_module := "app.main:app"
backend_config_path := "shared/settings/config.yaml"
test_config_path := backend_dir + "/shared/settings/config.test.yaml"
demo_config_path := backend_dir + "/shared/settings/config.demo.yaml"
python := env_var_or_default("PYTHON", justfile_directory() + "/" + backend_dir + "/venv/bin/python")

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
    cd {{ backend_dir }}/report_service && env -u DATABASE_URL CONFIG_PATH="{{ justfile_directory() }}/{{ backend_dir }}/shared/settings/config.demo.yaml" PYTHONPATH="{{ justfile_directory() }}/{{ backend_dir }}" {{ python }} -m alembic upgrade head

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

# ─── Demo stack (rsdobin.online) ─────────────────────────────────────────────

[doc('Start demo stack')]
deploy-demo1-up: _docker
    {{ compose_demo1 }} up -d --build

[doc('Stop demo stack')]
deploy-demo1-down: _docker
    {{ compose_demo1 }} down --remove-orphans

[doc('Show demo stack status')]
deploy-demo1-status: _docker
    {{ compose_demo1 }} ps

[doc('Follow demo logs (optional: service name)')]
deploy-demo1-logs service="":
    {{ compose_demo1 }} logs -f {{ service }}

[doc('Rebuild and restart demo stack')]
deploy-demo1-rebuild: _docker
    {{ compose_demo1 }} up -d --build --force-recreate

# ─── Prod stack (rsdobin.ru) ──────────────────────────────────────────────────

[doc('Start prod stack')]
deploy-prod-up: _docker
    {{ compose_prod }} up -d --build

[doc('Stop prod stack')]
deploy-prod-down: _docker
    {{ compose_prod }} down --remove-orphans

[doc('Show prod stack status')]
deploy-prod-status: _docker
    {{ compose_prod }} ps

[doc('Follow prod logs (optional: service name)')]
deploy-prod-logs service="":
    {{ compose_prod }} logs -f {{ service }}

[doc('Rebuild and restart prod stack')]
deploy-prod-rebuild: _docker
    {{ compose_prod }} up -d --build --force-recreate

[doc('Stop both prod and demo stacks')]
deploy-down-all: _docker
    {{ compose_prod }} down --remove-orphans 2>/dev/null || true
    {{ compose_demo1 }} down --remove-orphans 2>/dev/null || true
    @echo "All deploy stacks stopped."

[doc('Run frontend locally in presentation mode (Vite, mock APIs)')]
frontend-demo:
    cd frontend && npm run dev:demo

[doc('Run Demo 1 UI locally (frontend_demos, partial mock)')]
frontend-demo1:
    cd frontend_demos && npm run dev


# ─── MinIO (S3) helpers ───────────────────────────────────────────────────────

[doc('Start local MinIO container (S3-compatible, port 9000 API / 9001 console)')]
minio-up: _docker
    {{ compose }} up -d minio

[doc('Create rsd-bucket in local MinIO (run once after minio-up)')]
minio-init: minio-up
    @until docker compose -f docker-compose.local.yml exec -T minio curl -sf http://localhost:9000/minio/health/live >/dev/null 2>&1; do printf '.'; sleep 1; done
    {{ compose }} run --rm minio-init

[doc('Open MinIO console in browser (http://localhost:9001, user: minioadmin)')]
minio-console:
    @open http://localhost:9001 2>/dev/null || xdg-open http://localhost:9001 2>/dev/null || echo "Open http://localhost:9001 in browser"


# ─── Production deploy ────────────────────────────────────────────────────────

[doc('Generate production secrets (config.production.yaml) — run once before deploy-prod-up')]
prod-secrets: deploy-secrets

[doc('First-time production deploy: stop old stacks, start full production stack with all services')]
deploy-prod-setup: _docker
    @echo "Stopping any existing stacks on port 80/443..."
    just deploy-down-all 2>/dev/null || true
    @echo "Starting production stack (nginx + frontend + backend + report_service + db + replica + report_db + redis + kafka + minio)..."
    {{ compose_prod }} up -d --build
    @echo ""
    @echo "Stack is starting. Run 'just deploy-prod-status' to check health."
    @echo "Run 'just deploy-prod-logs' to follow logs."

[doc('Show production stack service health')]
deploy-prod-health: _docker
    @echo "=== Production stack health ==="
    {{ compose_prod }} ps

[doc('Seed production demo data (only for demo/docker environments — skipped in production mode)')]
deploy-prod-seed: _docker
    {{ compose_prod }} exec backend python -m scripts.seed_demo


# ─── Gateway (dual-domain reverse proxy) ─────────────────────────────────────
# Architecture: rsdobin.ru → prod | rsdobin.online → demo1
# Both prod and demo nginx containers are on the rsd_gateway Docker network.
# The gateway nginx is the ONLY container that binds ports 80/443 on the host.

[doc('Create the shared rsd_gateway Docker network (run once on server)')]
gateway-network: _docker
    @docker network inspect rsd_gateway >/dev/null 2>&1 && echo "rsd_gateway network already exists" || (docker network create rsd_gateway && echo "rsd_gateway network created")

[doc('Start gateway with HTTPS (SSL certs must already exist in deploy/certbot/conf/)')]
gateway-up: _docker gateway-network
    {{ compose_gateway }} up -d --build

[doc('Stop gateway')]
gateway-down: _docker
    {{ compose_gateway }} down --remove-orphans

[doc('Rebuild and restart gateway')]
gateway-rebuild: _docker
    {{ compose_gateway }} up -d --build --force-recreate

[doc('Show gateway status')]
gateway-status: _docker
    {{ compose_gateway }} ps

[doc('Follow gateway logs')]
gateway-logs:
    {{ compose_gateway }} logs -f nginx

[doc('STEP 1 — First-time SSL setup: start gateway with HTTP-only config for ACME challenge')]
gateway-init: _docker gateway-network
    @echo "Starting gateway in HTTP-only mode (for ACME challenge)..."
    docker run -d --name rsd-gateway-nginx-init \
        --network rsd_gateway \
        -p 80:80 \
        -v "$(pwd)/deploy/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" \
        -v "$(pwd)/deploy/nginx/gateway-init.conf:/etc/nginx/conf.d/gateway.conf:ro" \
        -v "$(pwd)/deploy/certbot/www:/var/www/certbot:ro" \
        nginx:1.27-alpine 2>/dev/null || docker start rsd-gateway-nginx-init
    @echo "HTTP gateway running. Now run: just gateway-certonly-prod && just gateway-certonly-demo"

[doc('STEP 2a — Get SSL cert for rsdobin.ru (run after gateway-init)')]
gateway-certonly-prod:
    docker run --rm \
        -v "$(pwd)/deploy/certbot/www:/var/www/certbot" \
        -v "$(pwd)/deploy/certbot/conf:/etc/letsencrypt" \
        certbot/certbot certonly \
        --webroot -w /var/www/certbot \
        -d rsdobin.ru \
        --email admin@rsdobin.ru --agree-tos --no-eff-email

[doc('STEP 2b — Get SSL cert for rsdobin.online (run after gateway-init)')]
gateway-certonly-demo:
    docker run --rm \
        -v "$(pwd)/deploy/certbot/www:/var/www/certbot" \
        -v "$(pwd)/deploy/certbot/conf:/etc/letsencrypt" \
        certbot/certbot certonly \
        --webroot -w /var/www/certbot \
        -d rsdobin.online \
        --email admin@rsdobin.ru --agree-tos --no-eff-email

[doc('STEP 3 — After certs obtained: stop HTTP-only gateway and start full HTTPS gateway')]
gateway-ssl-activate: _docker
    @docker stop rsd-gateway-nginx-init 2>/dev/null || true
    @docker rm rsd-gateway-nginx-init 2>/dev/null || true
    just gateway-up
    @echo "Gateway running with HTTPS for rsdobin.ru and rsdobin.online"

[doc('Renew SSL certificates for both domains')]
gateway-renew:
    docker run --rm \
        -v "$(pwd)/deploy/certbot/www:/var/www/certbot" \
        -v "$(pwd)/deploy/certbot/conf:/etc/letsencrypt" \
        certbot/certbot renew
    {{ compose_gateway }} exec nginx nginx -s reload

# ─── One-command launchers ────────────────────────────────────────────────────

[doc('Start prod: stop all app stacks → build & start prod → seed — ONE command')]
prod: _docker gateway-network
    @echo "=== Stopping prod/demo app stacks (gateway stays up) ==="
    just deploy-down-all
    @echo "=== Building and starting production stack ==="
    {{ compose_prod }} up -d --build --wait
    @echo "=== Seeding demo data ==="
    {{ compose_prod }} exec backend python -m scripts.seed_demo
    @echo ""
    @echo "Production is up → rsdobin.ru | Logs: just deploy-prod-logs"

[doc('Start demo1: stop all app stacks → build & start demo1 — ONE command')]
demo1: _docker gateway-network
    @echo "=== Stopping prod/demo app stacks (gateway stays up) ==="
    just deploy-down-all
    @echo "=== Building and starting Demo 1 stack ==="
    {{ compose_demo1 }} up -d --build --wait
    @echo ""
    @echo "Demo 1 is up → rsdobin.online | Logs: just deploy-demo1-logs"

[doc('Start BOTH prod (rsdobin.ru) and demo1 (rsdobin.online) simultaneously')]
all: _docker gateway-network
    @echo "=== Building and starting production stack ==="
    {{ compose_prod }} up -d --build
    @echo "=== Building and starting Demo 1 stack ==="
    {{ compose_demo1 }} up -d --build
    @echo "=== Waiting for all services to be healthy ==="
    {{ compose_prod }} up -d --wait
    {{ compose_demo1 }} up -d --wait
    @echo "=== Seeding prod demo data ==="
    {{ compose_prod }} exec backend python -m scripts.seed_demo
    @echo ""
    @echo "Both stacks up: rsdobin.ru (prod) | rsdobin.online (demo)"
