# Demo 1 runbook (`demo1-partial-mock`)

Демонстрация **Этапа 6**: живой backend для auth и кадров, остальной UI — дизайн-моки.

**Важно:** частично моковый UI живёт в **`frontend_demos/`**. Основной **`frontend/`** — для разработки без demo1-моков.

## Архитектура

| Компонент | Путь / стек |
|-----------|-------------|
| Dev frontend | `frontend_demos/` |
| Prod frontend image | `deploy/docker-compose.demo1.yaml` → `frontend_demos` |
| Backend | полный стек (как production); лишние API просто не вызываются из demo UI |

## Локальная разработка

### Backend

```bash
just infra-up
just migrate
just seed    # при необходимости
just dev
```

### Demo 1 UI

```bash
cd frontend_demos && npm install
just frontend-demo1
```

Откройте Vite URL. Баннер: «Demo 1 — кадры и табели на backend…».

## Деплой (сервер)

```bash
# deploy/.env.production — домен, SSL, DB
just deploy-down-all      # освободить 80/443
just deploy-demo1-up
just deploy-demo1-status
just deploy-demo1-logs backend
```

Остановка:

```bash
just deploy-demo1-down
```

Стек: `deploy/docker-compose.demo1.yaml` (project `rsd-demo1`).

## Live vs mock (только в frontend_demos)

### Live backend

- Auth, User, AdminStaff, Personnel

### Mock (без сетевых запросов)

- Knowledge, Sellings, Locations, AdminSoftware

Конфиг: `frontend_demos/src/config/demo1Mode.ts`.

## Сценарий демо

1. Войти как `staff_admin_001`.
2. Сотрудники, ставки, табели — реальный API.
3. Войти как `seller_anna_001` — обучение/продажи на моках (бейдж «Дизайн»).
4. Раздел «Блоки» в кадрах — мок структуры.

Чеклист: [DEMO1_SMOKE_CHECKLIST.md](./DEMO1_SMOKE_CHECKLIST.md).

## Smoke backend

```bash
just smoke
```

## Ограничения

- **P0-2** (импорт табеля из файла) отложен.
- Структура (блоки/точки) в demo UI на моках.
- Синхронизация `frontend` → `frontend_demos` — вручную при обновлении демо.

## Связанные документы

- [DEMO1_STAGE6_GAP_AND_PLAN.md](./DEMO1_STAGE6_GAP_AND_PLAN.md)
- [DEMO1_SMOKE_CHECKLIST.md](./DEMO1_SMOKE_CHECKLIST.md)
