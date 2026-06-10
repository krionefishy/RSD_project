# RSD

Корпоративная система и HR-учет (2 в 1): обучение, продажи, кадровые процессы, отчеты и рейтинги.

## Текущее состояние

- Реализован backend-каркас: `auth`, `users`, `knowledge_base`, часть `admin`.
- Модули `personnel`, `sales-motivation`, `reports-ratings` описаны в ТЗ и готовятся к реализации.
- API продаж доступно по `/api/v1/sales/*`.

## Документация

- Обзор: [docs/Обзор.md](/Users/dmitrii/Desktop/RSD/docs/Обзор.md)
- Версионные ТЗ (Markdown): `docs/md/*`
- Версионные ТЗ (Word): `docs/docs/*`

## Роли

- `super_admin`
- `root_admin` (админ ПО)
- `admin_staff` (админ персонала)
- `admin_education`
- `admin_sales`
- `manager`
- `seller`

## Аутентификация

- Логин: `external_system_id`
- Email не используется как идентификатор пользователя.

## Запуск

Список команд: `just` (или `just --list`).

| Задача | Команда |
|--------|---------|
| Локальная инфра (Postgres, Redis, Kafka) | `just infra-up` |
| Backend на хосте | `just backend` |
| Демо UI на ноутбуке (полные моки) | `just frontend-demo` |
| Demo 1 UI на ноутбуке (`frontend_demos`) | `just frontend-demo1` |
| Демо на сервере (nginx + frontend, моки) | `just deploy-demo-up` |
| Demo 1 на сервере (backend + `frontend_demos`) | `just deploy-demo1-up` |
| Production на сервере (полный стек) | `just deploy-prod-up` |
| Остановить оба deploy-стека | `just deploy-down-all` |

Перед deploy на сервере: `deploy/.env.production`, certbot — см. `docs/NGINX_DEPLOY.md`.
Секреты для `.env`: `just deploy-secrets`.
