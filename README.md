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

- Локальная инфраструктура: `docker compose -f docker-compose.local.yml up -d` (см. `justfile`)
- Демо UI (моки, без backend): `cd frontend && npm run dev:demo`
- Production на сервере: `docs/NGINX_DEPLOY.md`
- Демо на сервере (nginx + frontend): `deploy/docker-compose.demo.yaml` — см. `docs/NGINX_DEPLOY.md`
