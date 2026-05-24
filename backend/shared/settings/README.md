# Configuration

The application uses YAML configuration files, following the pattern from `barista_project`.

## Files

| File | Purpose | Location |
|------|---------|----------|
| `config.yaml` | Production / default configuration | Project root (`/Users/dmitrii/Desktop/RSD/`) |
| `shared/settings/config.test.yaml` | Test configuration (pytest) | `backend/shared/settings/` |
| `shared/settings/config.demo.yaml` | Demo environment (destructive DB seed) | `backend/shared/settings/` |

## Usage

### Default (production)

```bash
python -m backend.app.main
```

Looks for `config.yaml` in the project root automatically.

### Custom path

```bash
CONFIG_PATH=/etc/rsd/config.yaml python -m backend.app.main
```

### Testing

```bash
# Uses config.test.yaml automatically when running from backend directory
cd backend
pytest

# Or explicitly
cd backend
CONFIG_PATH=shared/settings/config.test.yaml pytest
```

### Demo

Reset and fill the database with demo data (requires `environment: demo` in config):

```bash
CONFIG_PATH=backend/shared/settings/config.demo.yaml uv run python -m backend.scripts.seed_demo
```

Frontend with demo login shortcuts on the login screen:

```bash
cd frontend
npm run dev:demo
```

Demo accounts are defined in `backend/scripts/demo_accounts.json` (one user per `UserRole`, plus extra sellers).

## Configuration Structure

```yaml
database:
  host: db
  port: 5432
  user: app
  password: appsecret
  database: rsd_db

backend:
  logging:
    level: INFO
  env:
    mode: prod  # or "testing", "development"
  jwt:
    secret: your-secret-key-min-32-chars-long
    algorithm: HS256
    access_expire_seconds: 900      # 15 minutes
    refresh_expire_seconds: 259200  # 3 days
    rsa_private_key_pem: null       # Set for production or use env var
    rsa_key_size: 2048
  redis:
    host: redis
    port: 6379
    db: 0
  kafka:
    bootstrap_servers: kafka:9092
    consumer_group: rsd-backend-group
    max_request_size: 10485760  # 10MB
  s3:
    endpoint_url: https://storage.yandexcloud.net
    tenant_id: your-tenant-id
    key_id: your-key-id
    secret_key: your-secret-key
    bucket_name: rsd-bucket
```

## Environment Variables Override

Individual values can be overridden via environment variables:

| Variable | Description |
|----------|-------------|
| `CONFIG_PATH` | Path to config YAML file |
| `DATABASE_URL` | Full database URL (overrides database.*) |
| `JWT_SECRET` | JWT signing secret |
| `AUTH_RSA_PRIVATE_KEY_PEM` | RSA private key for password encryption |
| `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_CONSUMER_GROUP`, `KAFKA_MAX_REQUEST_SIZE` | Kafka connection |
| `S3_ENDPOINT_URL`, `S3_KEY_ID`, `S3_SECRET_KEY`, `S3_BUCKET_NAME`, `S3_TENANT_ID`, `S3_REGION`, `S3_VERIFY` | S3 connection (`S3_KEYID` is supported as a legacy alias) |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB` | Redis connection |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) |
