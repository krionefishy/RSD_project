# RSD Project Rules

## 1. Общее описание проекта

RSD — платформа для обучения сотрудников сети точек питания.

**Основные цели:**
- Обучение персонала через структурированные курсы и тесты
- Гибкая ролевая модель (сотрудник, администратор, супер-администратор)
- Учет прогресса обучения и ежемесячные рейтинги

---

## 2. Бэкенд (Монолит)

**Модульный монолит** — единое приложение с четким разделением по доменам.

```
backend/
├── app/
│   ├── main.py              # Точка входа FastAPI
│   ├── application.py       # Application класс, lifespan
│   ├── api/
│   │   └── router.py        # Корневой роутер + health (/api/v1/health)
│   ├── knowledge_base/      # Домен: База знаний
│   │   ├── api/             #   Routes (DishkaRoute + FromDishka)
│   │   ├── usecases/        #   Бизнес-логика (commit/rollback)
│   │   ├── domain.py        #   Входные Pydantic модели
│   │   ├── dto.py           #   Выходные Pydantic модели
│   │   └── db_models.py     #   SQLAlchemy ORM
│   ├── users/
│   ├── sellings/
│   └── admin/
├── shared/
│   ├── di/providers/        # dishka — централизованные провайдеры
│   ├── kafka_streams/       # Kafka: producer, consumer, subscribers
│   └── settings/            # Config (YAML + env)
└── storage/
    ├── pg/                  # PostgreSQL + Base
    ├── redis/
    ├── s3/
    └── migrations/          # Alembic
```

**Правила:**
1. **API** — роуты, валидация, вызов usecase через dishka (`FromDishka`)
2. **Usecases** — бизнес-логика, получают `AsyncSession` и другие зависимости через `__init__`, сами управляют `commit`/`rollback`
3. **Domain** — входные Pydantic модели
4. **DTO** — выходные Pydantic модели
5. **DB Models** — SQLAlchemy ORM, `Base` из `storage.pg.database`
6. **DI** — dishka, провайдеры в `shared/di/providers/`, usecase регистрируются через `provide_all`
7. **Kafka/S3** — все S3 upload/delete только через Kafka topics `storage.s3.<domain>.<action>` и отдельные `s3_consumers`; прямые `put_object/delete_object` разрешены только внутри Kafka consumer; из бизнес-кода напрямую к S3 можно только GET/presigned GET
8. **Docker** — Traefik (без nginx), `proxy` + `internal` сети

---

## 3. Фронтенд

### Стек

| Слой | Технология |
|------|------------|
| Язык | TypeScript (`strict: true`) |
| UI | React 18 |
| Роутинг | react-router 7 (`createBrowserRouter`) |
| Состояние | jotai |
| Данные | Mock-first (`src/mock/mockData.ts`) |
| UI-kit | shadcn/Radix |
| Стили | Tailwind CSS v4 |
| Сборка | Vite 6 |

### Структура

```
frontend/
├── src/
│   ├── app/          # App.tsx, routes.tsx
│   ├── components/   # ui/ + общие компоненты
│   ├── context/      # AppContext
│   ├── mock/         # Mock-данные
│   ├── pages/        # Экраны по ролям
│   ├── store/        # Jotai atoms
│   ├── styles/       # tailwind.css + theme.css
│   ├── templates/    # Layout-шаблоны ролей
│   └── types/        # TypeScript интерфейсы
├── Dockerfile
└── nginx.conf
```

---

## 4. Инфраструктура

- Production: `deploy/docker-compose.yaml` (nginx + TLS + full stack)
- Demo (presentation): `deploy/docker-compose.demo.yaml` (nginx + frontend only, mock data)
- Local infra: `docker-compose.local.yml` (Postgres, Kafka, Redis)
- CI: `docker-compose.ci.yaml` (Postgres for tests)
- Сети: `proxy` (внешняя) / `internal` (изолированная)
- Новые микросервисы оформляются по `.cursor/rules/MICROSERVICE_TEMPLATE.md`: своя БД/миграции, общие Kafka/S3/Redis, локальные DI providers.

---

## 5. Документация

- `docs/BACKEND_ARCHITECTURE.md` — архитектура бэкенда
- `docs/ROLE_MODEL.md` — ролевая модель
- `docs/AUTH.md` — аутентификация и авторизация
- `docs/SETUP.md` — настройка окружения
