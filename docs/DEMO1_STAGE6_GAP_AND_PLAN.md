# Demo 1 (Этап 6) — gap analysis и план

Scope: **только Demo 1** (авторизация, кадры, профили, ставки, табели).

## Runbook

- **[DEMO1_BRANCH_RUNBOOK.md](./DEMO1_BRANCH_RUNBOOK.md)** — локальный запуск и деплой (`just deploy-demo1-up`)
- Demo UI: **`frontend_demos/`** (не основной `frontend/`)

## Статус

| Область | Статус |
|---------|--------|
| Auth по ролям + inactive block | ✅ |
| Управление сотрудниками | ✅ |
| Профили, ставки, табели | ✅ |
| Импорт табеля (P0-2) | ⏸ отложен |
| Аватар (политика файлов) | ✅ |
| Smoke suite | ✅ `just smoke` |
| Demo branch + `frontend_demos` | ✅ |
| `docker-compose.demo1.yaml` | ✅ |

## Ссылки

- [DEMO1_SMOKE_CHECKLIST.md](./DEMO1_SMOKE_CHECKLIST.md)
