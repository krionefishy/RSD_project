FROM python:3.12-slim
WORKDIR /app
COPY shared ./shared
COPY admin_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY admin_service/ .
ENV PYTHONPATH=/app
CMD ["uvicorn", "app.api.app:app.app", "--host", "0.0.0.0", "--port", "8000"]
