FROM python:3.12-slim as builder

WORKDIR /backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim

WORKDIR /backend

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY backend/app/ ./app/
COPY backend/shared/ ./shared/
COPY backend/storage/ ./storage/
COPY backend/scripts/ ./scripts/
COPY migrations/ /migrations/
COPY alembic.ini /alembic.ini
COPY backend/docker-entrypoint.sh /usr/local/bin/backend-entrypoint.sh

RUN chmod +x /usr/local/bin/backend-entrypoint.sh

ENV PYTHONPATH=/backend
ENV LOG_LEVEL=INFO
ENV CONFIG_PATH=/backend/shared/settings/config.docker.yaml
ENV RUN_MIGRATIONS=true
ENV RUN_DEMO_SEED=true

EXPOSE 8000

ENTRYPOINT ["backend-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
