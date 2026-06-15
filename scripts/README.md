# Scripts

## Demo 1 database dump (`seed_demo1.py`)

Заполняет БД данными для **демонстрации Этапа 6** (см. `docs/DEMO1_STAGE6_GAP_AND_PLAN.md`).

### Что делает скрипт

1. **Очищает** все таблицы (`TRUNCATE … RESTART IDENTITY CASCADE`).
2. **Заполняет** только контур Demo 1:

| Данные | Описание |
|--------|----------|
| **Пользователи** | 9 учёток из `backend/scripts/demo_accounts.json`, пароль `Password123!` |
| **Роли** | `super_admin`, `root_admin`, `admin_staff`, `admin_education`, `admin_sales`, `manager`, `seller` ×3 |
| **Структура** | 2 блока (Северный/Южный), 3 точки (ТЦ Метрополис, ТЦ Европарк, ТЦ Крокус Сити), менеджер → северный блок |
| **Продавцы** | Анна, Кирилл (активны), Ольга (**неактивна** — проверка блокировки входа) |
| **Коды активности** | Я, Н, В, Б |
| **Ставки/оклады** | Compensation для трёх продавцов |
| **Табели** | 5 записей смен (июнь 2026): С1/С2, выходной и отсутствие для демо календаря и edit/delete |

### Что не заполняется

- Курсы, материалы, тесты (обучение — мок в `frontend_demos`)
- Продажи, мотивация (мок в `frontend_demos`)
- Отчёты (будущий `report_service`)

### Быстрый старт

```bash
just demo1-local          # всё: infra + migrate + seed + backend + report_service + UI
just demo1-local --fresh  # с полным сбросом основной БД
just demo1-local --no-seed
just demo1-local --setup-only

# по шагам:
just demo1-setup    # infra + migrate + seed
just infra-up
just demo1-seed
```

### Безопасность

Скрипт отказывается работать, если `environment` в конфиге не `demo`, `docker` или `development`.

Аккаунты для входа совпадают с `frontend_demos` / `frontend` (`demoAccounts.ts`).
