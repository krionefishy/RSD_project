# Configuration

The application uses YAML configuration files, following the pattern from `barista_project`.

## Files

| File | Purpose | Location |
|------|---------|----------|
| `config.yaml` | Production / default configuration | Project root (`/Users/dmitrii/Desktop/RSD/`) |
| `shared/settings/config.test.yaml` | Test configuration (pytest) | `backend/shared/settings/` |

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
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB` | Redis connection |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARNING, ERROR) |

