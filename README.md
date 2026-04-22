# Робин Сдобин — Мобильный кабинет продавца

Корпоративная платформа для сети пекарен «Робин Сдобин»: обучение персонала, отслеживание продаж, рейтинги и мотивация.

## Фирменный стиль

Приложение выполнено в фирменных цветах бренда «Робин Сдобин»:

| Цвет | HEX | Использование |
|------|-----|---------------|
| 🟢 Зелёный (лес) | `#2E7D32` | Основной, заголовки, кнопки |
| 🟡 Золотой (выпечка) | `#F5A623` | Акценты, иконки, графики |
| 🔴 Ягодный | `#C41E3A` | Вторичный акцент, важные действия |
| 🟤 Кремовый фон | `#FFF8F0` | Фон приложения |

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4, Jotai (PWA) |
| Backend | Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Dishka (DI) |
| БД | PostgreSQL 15+ |
| Миграции | Alembic (единые для всей БД) |
| Очереди | Apache Kafka (фоновые задачи) |
| Кэш | Redis 7 |
| Хранилище | S3 (через Kafka-подписчики) |
| Reverse Proxy | Traefik (единый entrypoint, SSL через Let's Encrypt) |
| Контейнеризация | Docker, Docker Compose |

> **Архитектура Backend:** см. [docs/USECASE_RULES.md](docs/USECASE_RULES.md) — подход UseCase + DI (Dishka).

---

## Структура репозитория

```
RSD/
├── backend/
│   ├── app/
│   │   ├── api/router.py          # Корневой роутер API (/api/v1)
│   │   ├── application.py         # FastAPI app, lifespan, DI setup
│   │   ├── auth/deps.py           # JWT валидация, AuthContext
│   │   ├── knowledge_base/        # Модуль: База знаний
│   │   │   ├── api/               #   Роутеры (/kb/courses, /kb/materials, /kb/tests)
│   │   │   ├── usecases/          #   Use cases (бизнес-логика)
│   │   │   ├── domain.py          #   Pydantic входные модели
│   │   │   ├── dto.py             #   Pydantic выходные модели
│   │   │   └── db_models.py       #   SQLAlchemy ORM модели
│   │   ├── locations/             # Модуль: Локации и блоки
│   │   ├── users/                 # Модуль: Пользователи
│   │   └── admin/                 # Модуль: Администрирование
│   ├── shared/
│   │   ├── di/providers/          #   DI провайдеры (Dishka)
│   │   ├── settings/config.py     #   Конфигурация (Settings, JWTConfig)
│   │   └── kafka_streams/         #   Kafka producer/consumer
│   ├── storage/
│   │   ├── pg/database.py         #   PostgreSQL подключение
│   │   └── migrations/            #   Alembic миграции
│   └── requirements.txt
├── docs/
│   ├── KNOWLEDGE_BASE_SCENARIOS.md    # Use cases (пользовательская часть)
│   ├── ADMIN_KNOWLEDGE_SCENARIOS.md   # Use cases (административная часть)
│   ├── USECASE_RULES.md               # Правила написания use cases
│   └── ROLE_MODEL.md                  # Ролевая модель
├── docker-compose.yml
└── .env.example
```

---

## Архитектура Backend

### UseCase подход

Каждая бизнес-операция реализована как отдельный UseCase класс:

```
backend/app/<module>/usecases/<entity>/<action>.py
```

Пример: `backend/app/knowledge_base/usecases/courses/get_by_id.py`

```python
class GetCourseByIdUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(self, course_id: int, user_id: str, role: str) -> CourseDTO | None:
        # Проверка прав
        # Запрос к БД с selectinload
        # Возврат DTO или None
```

### Dependency Injection (Dishka)

```python
# DI провайдер создает сессию для каждого запроса
class SessionProvider(Provider):
    @provide(scope=Scope.REQUEST)
    async def session(self, db: Database) -> AsyncIterator[AsyncSession]:
        session = db.session()
        try:
            yield session
        finally:
            await session.close()

# UseCase получает сессию через конструктор
class KnowledgeBaseUsecaseProvider(Provider):
    get_course_by_id = provide(GetCourseByIdUseCase)

# Route получает готовый usecase
async def get_course_by_id(
    usecase: GetCourseByIdUseCase = FromDishka[GetCourseByIdUseCase],
):
```

### Аутентификация (JWT)

Используется `python-jose` для валидации JWT:

| Код | Ситуация |
|-----|----------|
| 403 | Невалидный токен (bad signature, malformed) |
| 401 | Токен expired или пользователь не найден в БД |

```python
async def validate_jwt_token(...) -> AuthContext:
    # Валидация подписи и срока
    # Проверка существования пользователя в БД
    return AuthContext(user_id=str(user.id), role=user.role.value)
```

### URL структура

```
/api/v1/
├── /health                      # Health check
├── /kb/                         # Knowledge Base
│   ├── /courses/{id}           # GET - курс по ID
│   ├── /materials/...
│   └── /tests/...
├── /users/...                   # Users module
├── /sellings/...                # Sellings module
└── /admin/...                   # Admin module
```

### Правила слоев

1. **API** (`api/routes.py`): валидация JWT, вызов usecase, HTTP ответы
2. **UseCases** (`usecases/`): бизнес-логика, проверка прав, транзакции
3. **Domain** (`domain.py`): входные Pydantic модели
4. **DTO** (`dto.py`): выходные Pydantic модели
5. **DB Models** (`db_models.py`): SQLAlchemy ORM

---

## Быстрый старт

### 1. Переменные окружения

```bash
cp .env.example .env
```

### 2. Инфраструктура (DB + Kafka)

```bash
docker compose -f docker-compose.local.yml up -d
```

### 3. Миграции

```bash
cd backend
alembic upgrade head
```

### 4. Запуск backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.application:create_app --reload --port 8000
```

### 5. Запуск frontend

```bash
cd frontend
npm ci
npm start
```

---

## Документация

| Документ | Описание |
|----------|----------|
| [docs/USECASE_RULES.md](docs/USECASE_RULES.md) | Правила написания use cases (структура, DI, JWT) |
| [docs/KNOWLEDGE_BASE_SCENARIOS.md](docs/KNOWLEDGE_BASE_SCENARIOS.md) | Пользовательские use cases (17 шт.) |
| [docs/ADMIN_KNOWLEDGE_SCENARIOS.md](docs/ADMIN_KNOWLEDGE_SCENARIOS.md) | Административные use cases (21 шт.) |
| [docs/ROLE_MODEL.md](docs/ROLE_MODEL.md) | Ролевая модель (7 ролей) |
