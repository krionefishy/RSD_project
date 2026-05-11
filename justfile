# Justfile for RSD project

package := "backend/app backend/tests"
run := "cd backend && python -m"

# Load environment variables from .env
set dotenv-load

# Database settings from .env (ohs_arm_postgres_local)
export PGHOST := env_var_or_default("PGHOST", "localhost")
export PGPORT := env_var_or_default("PGPORT", "5400")
export PGUSER := env_var_or_default("PGUSER", "local_user")
export PGPASSWORD := env_var_or_default("PGPASSWORD", "local_password")
export PGDATABASE := env_var_or_default("PGDATABASE", "rsd_local")
export DATABASE_URL := env_var_or_default("DATABASE_URL", "postgresql+asyncpg://local_user:local_password@localhost:5400/rsd_local")

# Test database settings
export TEST_PGHOST := env_var_or_default("TEST_PGHOST", "localhost")
export TEST_PGPORT := env_var_or_default("TEST_PGPORT", "5400")
export TEST_PGUSER := env_var_or_default("TEST_PGUSER", "local_user")
export TEST_PGPASSWORD := env_var_or_default("TEST_PGPASSWORD", "local_password")
export TEST_PGDATABASE := env_var_or_default("TEST_PGDATABASE", "rsd_test")
export TEST_DATABASE_URL := env_var_or_default("TEST_DATABASE_URL", "postgresql+asyncpg://local_user:local_password@localhost:5400/rsd_test")

# Default task: run lint and test
[doc('Default: run linting and tests')]
default:
    just lint
    just test

# --- Code Quality ---

[doc('Run mypy type checking')]
mypy:
    cd backend && python -m mypy {{ package }} --show-traceback

[doc('Format code with ruff')]
format:
    cd backend && ruff format .

[doc('Check code with ruff')]
ruff-check:
    cd backend && ruff check .

[doc('Fix code issues with ruff')]
ruff-fix:
    cd backend && ruff check . --fix

[doc('Run all linters (format + check + mypy)')]
lint: format ruff-fix mypy

[doc('Check for common security issues')]
bandit:
    cd backend && bandit -r app -f json -o bandit-report.json || true
    cd backend && bandit -r app -f screen

# --- Tests ---

test-run := "cd backend && CONFIG_PATH=shared/settings/config.test.yaml python -m"

[doc('Run all tests')]
test *args:
    {{ test-run }} pytest tests/ -v --tb=short {{ args }}

[doc('Run tests with coverage report')]
test-coverage *args:
    {{ test-run }} pytest tests/ -v --tb=short --cov=app --cov-report=term-missing --cov-report=html {{ args }}

[doc('Run specific test file')]
test-file filepath *args:
    {{ test-run }} pytest {{ filepath }} -v --tb=short {{ args }}

[doc('Run tests matching pattern')]
test-pattern pattern *args:
    {{ test-run }} pytest tests/ -v -k "{{ pattern }}" {{ args }}

[doc('Full test reset (test db + tests)')]
test-full-reset: db-reset-test test

# --- Database ---

[doc('Create local development database')]
db-create:
    @PGPASSWORD={{ PGPASSWORD }} psql -U {{ PGUSER }} -d postgres -h {{ PGHOST }} -p {{ PGPORT }} -c "CREATE DATABASE {{ PGDATABASE }};" 2>/dev/null || echo "Database {{ PGDATABASE }} may already exist"

[doc('Drop local development database')]
db-drop:
    @PGPASSWORD={{ PGPASSWORD }} psql -U {{ PGUSER }} -d postgres -h {{ PGHOST }} -p {{ PGPORT }} -c "DROP DATABASE IF EXISTS {{ PGDATABASE }} WITH (FORCE);"

[doc('Reset local development database (drop + create)')]
db-reset: db-drop db-create

[doc('Create test database')]
db-create-test:
    @PGPASSWORD={{ TEST_PGPASSWORD }} psql -U {{ TEST_PGUSER }} -d postgres -h {{ TEST_PGHOST }} -p {{ TEST_PGPORT }} -c "CREATE DATABASE {{ TEST_PGDATABASE }};" 2>/dev/null || echo "Database {{ TEST_PGDATABASE }} may already exist"

[doc('Drop test database')]
db-drop-test:
    @PGPASSWORD={{ TEST_PGPASSWORD }} psql -U {{ TEST_PGUSER }} -d postgres -h {{ TEST_PGHOST }} -p {{ TEST_PGPORT }} -c "DROP DATABASE IF EXISTS {{ TEST_PGDATABASE }} WITH (FORCE);"

[doc('Reset test database (drop + create)')]
db-reset-test: db-drop-test db-create-test

[doc('Run migrations on local database')]
db-migrate:
    export PYTHONPATH=backend && DATABASE_URL={{ DATABASE_URL }} alembic upgrade head

[doc('Run migrations on test database')]
db-migrate-test:
    export PYTHONPATH=backend && DATABASE_URL={{ TEST_DATABASE_URL }} alembic upgrade head

[doc('Full reset with migrations (local db)')]
db-full-reset: db-reset db-migrate

[doc('Full reset with migrations (test db)')]
db-full-reset-test: db-reset-test db-migrate-test

[doc('Show database connection info')]
db-info:
    @echo "Local DB: {{ DATABASE_URL }}"
    @echo "Test DB:  {{ TEST_DATABASE_URL }}"

# --- Infrastructure ---

[private]
_check-docker:
    @docker info >/dev/null 2>&1 || { echo "Error: Docker daemon is not running. Please start Docker first."; exit 1; }

[doc('Show local infrastructure status')]
infra-status: _check-docker
    @docker ps | grep -E "(NAMES|ohs_arm)"

[doc('Create rsd_local and rsd_test databases in ohs_arm postgres')]
infra-setup-db: _check-docker
    @docker exec ohs_arm_postgres_local psql -U postgres -d postgres -c "CREATE DATABASE rsd_local;" 2>/dev/null || echo "Database rsd_local may already exist"
    @docker exec ohs_arm_postgres_local psql -U postgres -d postgres -c "CREATE DATABASE rsd_test;" 2>/dev/null || echo "Database rsd_test may already exist"
    @echo "Databases created: rsd_local, rsd_test"

[doc('Stop zecar-postgres container if running')]
infra-stop-zecar: _check-docker
    @docker stop zecar-postgres 2>/dev/null || echo "zecar-postgres is not running"

# --- Development ---

[doc('Install dependencies')]
install:
    cd backend && pip install -r requirements.txt

[doc('Run development server')]
dev:
    cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

[doc('Run production server')]
serve:
    cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

[doc('Create new migration')]
migration message:
    cd backend && alembic revision --autogenerate -m "{{ message }}"
