# RSD Backend — Модульный Монолит

Python 3.12+ / FastAPI / dishka / SQLAlchemy / Kafka / Redis / S3

## Быстрый старт

```bash
# Инфраструктура
docker compose -f ../docker-compose.local.yml up -d

# Python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp shared/settings/config.yaml.example shared/settings/config.yaml

# Запуск
export PYTHONPATH=$(pwd)
uvicorn app.main:app --reload
```

## Архитектура

Поток: **API → dishka (DI) → Usecase**

```
app/                        # Бизнес-логика (домены)
├── application.py          # Application: lifespan, инициализация
├── main.py                 # Точка входа (uvicorn)
├── api/router.py           # Корневой роутер + health
├── knowledge_base/         # Домен
│   ├── api/                #   Routes (DishkaRoute + FromDishka)
│   ├── usecases/           #   Бизнес-логика (AsyncSession через DI)
│   ├── domain.py           #   Входные модели (Pydantic)
│   ├── dto.py              #   Выходные модели (Pydantic)
│   └── db_models.py        #   ORM (SQLAlchemy)
├── users/
├── sellings/              # Техническое имя модуля (API: /sales)
└── admin/

shared/                     # Общие модули
├── di/providers/           #   dishka провайдеры (ALL_PROVIDERS)
├── kafka_streams/          #   Kafka: producer, consumer, subscribers
└── settings/               #   Config (YAML + env)

storage/                    # Хранилища
├── pg/database.py          #   PostgreSQL + Base
├── redis/client.py
└── s3/client.py
```

## DI (dishka)

Usecase получает зависимости через `__init__`, dishka резолвит автоматически:

```python
class MyUseCase:
    def __init__(self, session: AsyncSession, kafka: KafkaProducerWrapper):
        self._session = session
        self._kafka = kafka

    async def __call__(self, ...) -> ...:
        ...
```

Провайдеры в `shared/di/providers/`:
- `app.py` — инфраструктура (APP scope) + AsyncSession (REQUEST scope)
- `knowledge_base.py`, `users.py`, `sellings.py`, `admin.py` — usecases (REQUEST scope)
- `provider.py` — `ALL_PROVIDERS` (сборка)

## API Endpoints

- Health: `GET /api/v1/health`
- Docs: `GET /docs`
- Knowledge Base: `/api/v1/tests`, `/api/v1/materials`, `/api/v1/courses`
- Users: `/api/v1/users`
- Sales: `/api/v1/sales`
- Admin: `/api/v1/admin`
