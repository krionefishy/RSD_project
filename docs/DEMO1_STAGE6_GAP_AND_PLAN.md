# Demo 1 (Этап 6) — gap analysis и план

Документ по контракту «Приложение: этапы разработки и демонстраций». Scope: **только Demo 1** (авторизация, кадры, профили, ставки, табели).

## Runbook demo-ветки

Пошаговый запуск частично мокового фронта: **[DEMO1_BRANCH_RUNBOOK.md](./DEMO1_BRANCH_RUNBOOK.md)** (ветка `demo1-partial-mock`).

## Статус по пунктам контракта

| Область | Статус | Примечание |
|---------|--------|------------|
| Auth по ролям | ✅ | В т.ч. блокировка inactive (P0-1) |
| Управление сотрудниками | ✅ | AdminStaff API |
| Профили | ✅ | User / Personnel |
| Ставки и оклады | ✅ | Compensation UI |
| Табели просмотр/правка | ✅ | P1-1 |
| Импорт табеля из файла | ⏸ | P0-2 отложен |
| Аватар (политика файлов) | ✅ | P1-2 |
| Smoke suite | ✅ | `just smoke`, P2-1 |
| Demo branch (partial mock) | ✅ | `demo1-partial-mock` |

## Отложено

- **P0-2** — парсинг загруженного файла табеля и создание смен; smoke upload помечен skipped.

## Ссылки

- [DEMO1_SMOKE_CHECKLIST.md](./DEMO1_SMOKE_CHECKLIST.md)
- [DEMO1_BRANCH_RUNBOOK.md](./DEMO1_BRANCH_RUNBOOK.md)
