FROM python:3.12-slim as builder

WORKDIR /service

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim

WORKDIR /service

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY backend/cash_ingestion_service/app/ ./app/
COPY backend/cash_ingestion_service/storage/ ./storage/
COPY backend/cash_ingestion_service/migrations/ ./migrations/
COPY backend/cash_ingestion_service/alembic.ini ./alembic.ini
COPY backend/cash_ingestion_service/docker-entrypoint.sh /usr/local/bin/cash-ingestion-entrypoint.sh
COPY backend/shared/ ./shared/

RUN chmod +x /usr/local/bin/cash-ingestion-entrypoint.sh

ENV PYTHONPATH=/service
ENV LOG_LEVEL=INFO
ENV CONFIG_PATH=/service/shared/settings/config.docker.yaml
ENV RUN_MIGRATIONS=true

EXPOSE 8000

ENTRYPOINT ["cash-ingestion-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
