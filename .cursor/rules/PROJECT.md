# RSD Project Rules

> Основные правила и конвенции для работы с проектом RSD (Retail Staff Development).
> Этот файл должен использоваться вместе с:
> - [CODING_RULES.md](./frontend/CODING_RULES.md)
> - [TEMPLATE_ARCHITECTURE.md](./frontend/TEMPLATE_ARCHITECTURE.md)

---

## 1. Общее описание проекта

RSD — платформа для обучения сотрудников сети точек питания (рестораны, кофейни).

**Основные цели:**
- Обучение персонала через структурированные курсы и тесты
- Гибкая ролевая модель (сотрудник, администратор, супер-администратор)
- Учет прогресса обучения и ежемесячные рейтинги

**Функционал сотрудника:**
- Профиль (личные данные, прогресс, уровень)
- База знаний (курсы, материалы, тесты)
- Продажи (учет продаж и KPI)

---

## 2. Структура проекта

### Документация

Вся документация и технические задания хранятся в директории [`docs/`](../../docs/):

- ТЗ по базе знаний: `docs/ТЗ блок базы знаний.docx`
- Другие ТЗ и спецификации — добавлять в эту папку

### Бэкенд

Backend-сервисы живут в [`backend/`](../../backend/).

**Единая конфигурация** (shared для всех сервисов):
```
backend/shared/
├── config/
│   ├── config.yaml         # Общий конфиг (переменные окружения ${VAR:-default})
│   └── config.example.yaml # Пример для локальной разработки
└── # другие shared-модули (DB, Kafka, base classes)
```

Текущая структура сервиса (шаблон для новых сервисов):
```
backend/knowledge_base_service/
├── app/
│   ├── api/           # FastAPI endpoints, dependencies
│   ├── repository/    # ORM models, accessors, base classes
│   ├── streams/       # Kafka consumers
│   └── utils/         # Config (использует shared/config/), store
├── tests/
└── main.py
```

**Архитектурные паттерны** (см. также [TEMPLATE_ARCHITECTURE.md](./frontend/TEMPLATE_ARCHITECTURE.md)):
- Application class с lifespan management
- Store pattern для доступа к данным
- Direct accessor calls из endpoints (без сервисного слоя)
- SQLAlchemy async ORM
- **Единый shared-конфиг** с поддержкой переменных окружения
- **Единый Dockerfile** в корне проекта для всех сервисов
- Shared модули для БД, Kafka, конфигурации

**Dockerfile:** [`Dockerfile`](../../Dockerfile) (в корне проекта) — общий для всех Python-сервисов, запуск через разные команды в docker-compose.

### Фронтенд

**Справочник для разработки фронтенда:** [`frontend_example/`](../../frontend_example/)

Включает:
- Полный набор компонентов и стилизации
- Примеры API-классов
- Роутинг и шаблоны страниц
- Redux структуру

При разработке нового фронтенда **обязательно** сверяться с frontend_example.

---

## 3. Фронтенд: обязательные правила

### Стек технологий

| Слой | Технология |
|------|------------|
| Язык | JavaScript (JSX) |
| UI | React 19 (функциональные компоненты) |
| Роутинг | react-router 7 (createBrowserRouter) |
| Состояние | Redux Toolkit |
| HTTP | axios |
| Стили | CSS Modules + classnames |
| Сборка | react-scripts (CRA) или Vite |

### Архитектура (обязательно следовать)

**Структура каталогов:**
```
frontend/
├── public/           # index.html, manifest.json (PWA), иконки
├── src/
│   ├── api/          # Классы для работы с API
│   ├── assets/       # Иконки, изображения
│   ├── components/   # Переиспользуемые UI-компоненты
│   ├── config/       # routerConfig.js, constants.js
│   ├── features/     # Redux slices, thunks
│   ├── hooks/        # Кастомные хуки
│   ├── mock/         # Mock-данные для разработки без бэкенда
│   ├── pages/        # Страницы по ролям (user/, admin/, auth/)
│   ├── store/        # Конфигурация Redux store
│   ├── templates/    # Layout-шаблоны (auth.jsx, user.jsx)
│   └── utils/        # Утилиты (authStorage, date helpers и т.д.)
├── Dockerfile        # Multi-stage: node -> nginx
└── nginx.conf        # SPA configuration
```

### PWA требования

- `manifest.json` с полями: `short_name`, `name`, `icons` (16, 24, 32, 64, 192, 512), `start_url`, `display: standalone`, `theme_color`, `background_color`
- Service Worker (можно использовать встроенный в react-scripts или настроить workbox)
- Иконки разных размеров в `public/`

### Роутинг

Все маршруты объявляются **в одном файле**: `src/config/routerConfig.js`

Используется объектная конфигурация `createBrowserRouter`.

Шаблоны (templates):
- `AuthTemplate` — страницы без авторизации (логин)
- `UserTemplate` — страницы сотрудника (с нижним меню)

Защита маршрутов реализуется в корневом компоненте `App` (`pages/app/app.jsx`) — проверка токена и ролей, редирект на `/auth/login`.

### API слой

Каждый домен — отдельный класс с методами:
```javascript
class AuthAPIClass {
    async login(email, password) { ... }
    async refresh(token) { ... }
}
export const AuthAPI = new AuthAPIClass();
```

Все API-классы используют общий axios instance из `APIClient.js` с interceptors для токенов.

### Redux структура

```
features/
├── user/              # user slice + thunks
│   ├── slice.js
│   ├── thunks.js
│   ├── selectors.js
│   ├── stateMappers.js
│   └── constants.js
└── statusReducer.js   # глобальный статус (isAdmin, isSuperAdmin)
```

### Компоненты

Каждый компонент — отдельная папка в `components/`:
```
components/
├── button/
│   ├── button.jsx
│   └── button.module.css
└── header/
    ├── header.jsx
    └── header.module.css
```

**Naming convention:**
- Папки и файлы — camelCase
- Компоненты — PascalCase
- CSS классы — camelCase через CSS Modules

---

## 4. Работа с ТЗ

При реализации функционала из ТЗ:
1. Прочитать соответствующий документ в `docs/`
2. Вынести все модели данных из ТЗ в `src/mock/`
3. Реализовать страницы согласно структуре из frontend_example
4. Использовать mocked API для первой итерации (без реального бэкенда)

---

## 5. Инфраструктура

### Docker

- Все сервисы запускаются через docker-compose
- Production: `docker-compose.prod.yaml` с Traefik
- Local: `docker-compose.local.yml`

### Traefik (production)

- Reverse proxy + SSL termination
- Let's Encrypt автоматическая генерация сертификатов
- Docker provider для service discovery
- HTTP -> HTTPS redirect middleware

### Сети

- `proxy` — внешняя сеть для Traefik
- `internal` — внутренняя изолированная сеть между сервисами

---

## 6. Чек-лист при создании нового фронтенда

- [ ] Создать структуру каталогов по шаблону
- [ ] Установить зависимости (react, react-router, redux toolkit, axios, classnames)
- [ ] Настроить PWA (manifest.json, иконки)
- [ ] Создать базовые компоненты (Header, Button, Loader, Menu, MenuItem)
- [ ] Настроить роутинг в `config/routerConfig.js`
- [ ] Создать шаблоны (templates/auth.jsx, templates/user.jsx)
- [ ] Реализовать auth guard в `pages/app/app.jsx`
- [ ] Создать mock-данные для всех сущностей
- [ ] Реализовать API-классы (mocked)
- [ ] Реализовать Redux slices для состояния
- [ ] Создать страницы согласно ТЗ
- [ ] Настроить Dockerfile и nginx.conf
- [ ] Добавить в docker-compose.prod.yaml

---

## 7. Ссылки

- [CODING_RULES.md](./frontend/CODING_RULES.md) — подробные правила кодирования
- [TEMPLATE_ARCHITECTURE.md](./frontend/TEMPLATE_ARCHITECTURE.md) — архитектурный шаблон
- [frontend_example](../../frontend_example/) — рабочий пример для справки
- [docs](../../docs/) — технические задания
