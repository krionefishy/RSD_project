# Demo 1 branch runbook (`demo1-partial-mock`)

Ветка для демонстрации **Этапа 6 (Demo 1)**: живой backend только в контуре кадров и табелей, остальной UI доступен как дизайн-демо на моках.

## Быстрый старт

### 1. Backend

```bash
just infra-up      # Postgres и зависимости
just migrate
just seed          # при необходимости
just dev           # API на :8000 (или ваш стандартный порт)
```

### 2. Frontend (Demo 1 mode)

```bash
just frontend-demo1
# или
cd frontend && npm run dev:demo1
```

Откройте Vite URL (обычно `http://localhost:5173`). В шапке появится синий баннер **«Demo 1 — кадры и табели на backend…»**.

### 3. Smoke backend

```bash
just smoke
```

Требуется Docker (тестовая БД на порту 5433).

## Переменные окружения

| Переменная | Demo 1 | Presentation (`dev:demo`) | Production dev |
|------------|--------|---------------------------|----------------|
| `VITE_DEMO1_MODE` | `true` | — | — |
| `VITE_DEMO_MODE` | `true` (подсказки входа) | `true` | — |
| `VITE_PRESENTATION_MODE` | — | `true` | — |
| `VITE_API_URL` | `/api/v1` | — | `/api/v1` |
| `VITE_MOCK_AUTH` | — | — | опционально |
| `VITE_MOCK_KB` | — | — | опционально |

Пример файла: `frontend/demo1.env.example`.

## Live vs mock модули

### Live backend (Demo 1)

- **Auth** — логин, refresh, logout, RSA
- **User** — `/users/me`, профили, аватар, собственный табель
- **AdminStaff** — сотрудники, ставки/оклады, табели (admin)
- **Personnel** — кадровые операции personnel-контура

### Принудительно mock (Demo 1)

- **Knowledge** — обучение, курсы, тесты
- **Sellings** — продажи, мотивация, рейтинг
- **Locations** — блоки и точки (дизайн; CRUD не бьёт в backend)
- **AdminSoftware** — админ ПО (заглушки)

Сетевые запросы к mock-модулям **не отправляются** — данные из `frontend/src/mock/`.

## Сценарий демонстрации

1. Войти как **Администратор кадров** (`staff_admin_001`, пароль из seed / демо-подсказки).
2. **Сотрудники** — список, карточка, ставки, аватар.
3. **Табели** — просмотр, правка activity code, удаление записи.
4. Переключиться на другую роль (выйти → войти) и открыть **Продавец / Обучение / Продажи** — данные моковые, бейдж «Дизайн».
5. Раздел **Блоки** в кадрах — мок структуры (не Demo 1 backend).

Чеклист: [DEMO1_SMOKE_CHECKLIST.md](./DEMO1_SMOKE_CHECKLIST.md).

## Известные ограничения

- **P0-2 (импорт табелей из файла)** — отложен: upload сохраняет файл, парсинг смен не создаёт записи. Smoke `test_demo1_upload_deferred_smoke` пропущен.
- **Структура (блоки/точки)** в Demo 1 на моках; привязка сотрудника к блоку в create-форме использует fixture ID — сверьте с seed backend или назначайте через уже существующих пользователей.
- **Presentation mode** (`npm run dev:demo`) — полностью без сети; не путать с Demo 1 mode.

## Файлы конфигурации

- `frontend/src/config/demo1Mode.ts` — флаг и allowlist
- `frontend/src/config/presentationMode.ts` — `useMockApiModule()`
- API guards: `frontend/src/api/*.ts`

## Связанные документы

- [DEMO1_STAGE6_GAP_AND_PLAN.md](./DEMO1_STAGE6_GAP_AND_PLAN.md) — gap analysis Этапа 6
- [DEMO1_SMOKE_CHECKLIST.md](./DEMO1_SMOKE_CHECKLIST.md) — ручной UI checklist
