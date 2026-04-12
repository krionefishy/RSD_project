# Общий Dockerfile для всех Python-сервисов
# Используется docker-compose для запуска разных сервисов через разные команды

FROM python:3.12-slim

WORKDIR /app

# Установка зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Копируем общий код
COPY backend/shared /app/backend/shared

# Копируем все requirements (будут установлены все зависимости всех сервисов)
COPY backend/knowledge_base_service/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Копируем код всех сервисов
COPY backend /app/backend

ENV PYTHONPATH=/app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

EXPOSE 8000

# Команда запускается через docker-compose для каждого сервиса отдельно
CMD ["python", "-m", "uvicorn", "backend.knowledge_base_service.app.api.app:app.app", "--host", "0.0.0.0", "--port", "8000"]
