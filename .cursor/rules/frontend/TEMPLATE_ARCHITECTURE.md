# TEMPLATE ARCHITECTURE

> **Backend архитектура:** см. [docs/BACKEND_ARCHITECTURE.md](../../docs/BACKEND_ARCHITECTURE.md) — модульный монолит с usecases, DI, Kafka.

---

# Часть 1. Обобщённый шаблон архитектуры (для любого проекта)

> Универсальный шаблон, адаптированный под текущий проект RSD.
> 
> **Frontend:** Vite + React 18 + TypeScript + Tailwind + Jotai
> **Backend:** Python + FastAPI + Модульный монолит (см. [BACKEND_ARCHITECTURE.md](../../docs/BACKEND_ARCHITECTURE.md))

## Стек и инструменты

| Слой | Выбор |
|------|-------|
| Язык | TypeScript (`strict`) |
| UI-фреймворк | React 18 (функциональные компоненты, хуки) |
| Состояние | Jotai atoms + локальный state (`useState`) |
| Роутинг | react-router (`createBrowserRouter`, объектная конфигурация) |
| Данные | Mock-first (`src/mock/mockData.ts`) |
| Стили | Tailwind CSS v4 + CSS tokens (`src/styles/theme.css`) |
| UI-библиотеки | Radix/shadcn, lucide-react, sonner, recharts |

---

## Корневая структура проекта

```
frontend/
├── public/                       # manifest, service-worker, иконки
└── src/
    ├── app/                      # App.tsx, routes.tsx
    ├── components/               # Переиспользуемые UI-компоненты
    ├── context/                  # AppContext и провайдеры
    ├── mock/                     # Mock-данные для статики
    ├── pages/                    # Страницы (по ролям / разделам)
    ├── store/                    # Jotai atoms
    ├── styles/                   # Tailwind + theme токены
    ├── templates/                # Layout-шаблоны (Outlet + меню)
    └── types/                    # TypeScript интерфейсы домена
```

---

## Слой страниц (`pages/`)

Страницы группируются по **ролям** или **разделам** приложения.
Каждая роль — отдельная папка. Внутри неё — папки отдельных страниц.

```
pages/
├── app/                          # Корневой layout (App): auth-гард, глобальные стили
│   ├── app.jsx                   # Проверка токена, загрузка пользователя, <Outlet>
│   ├── colorScheme.css           # :root { --app-*: ... } — цветовая схема
│   ├── pageStyle.css             # Глобальные layout-классы
│   └── zeroStyle.css             # CSS reset
│
├── auth/                         # Страницы без авторизации
│   ├── _styles/                  # Общие стили для группы
│   │   └── authPage.module.css
│   ├── login/
│   │   └── loginPage.jsx
│   └── register/
│       └── registerPage.jsx
│
├── <role-1>/                     # Страницы первой роли (user, client, ...)
│   ├── <pageName>/
│   │   ├── <pageName>.jsx        # Компонент страницы
│   │   ├── <pageName>.module.css # Стили
│   │   ├── ChildComponent.jsx    # Частный компонент (не экспортируется наружу)
│   │   └── localData.js          # Локальные данные / константы
│   └── ...
│
├── <role-2>/                     # Страницы второй роли (admin, manager, ...)
│   └── ...
│
└── <role-N>/                     # Страницы N-й роли
    └── ...
```

**Правило:** частные компоненты, которые нужны только одной странице, лежат **в папке этой страницы**, а не в `components/`.

---

## Переиспользуемые компоненты (`components/`)

Каждый компонент — **отдельная папка** с именем в camelCase.

```
components/
├── <componentName>/
│   ├── <componentName>.jsx       # export const ComponentName = ({ ... }) => { ... }
│   ├── <componentName>.module.css
│   └── <subComponent>/           # (опционально) подкомпонент
│       ├── <subComponent>.jsx
│       └── <subComponent>.module.css
└── ...
```

**Соглашения:**
- Экспорт: **named** (`export const`), не `export default`.
- Пропсы: деструктуризация в сигнатуре с дефолтными значениями.
- Стили: CSS Modules + `classnames` для условных классов.

---

## API-слой (`api/`)

```
api/
├── APIClient.js                  # Базовый класс:
│                                 #   - axios.create({ baseURL })
│                                 #   - Request interceptor: Bearer token
│                                 #   - Response interceptor: refresh token, redirect на login
│                                 #   - Методы: get, post, patch, put, delete
│                                 #   - Экспорт: API (синглтон), filterData (утилита)
│
├── AuthAPI.js                    # class AuthAPIClass { login, register, refresh, ... }
├── <Domain>API.js                # class <Domain>APIClass { fetch..., create..., update..., delete... }
└── ...
```

**Соглашения:**
- Каждый модуль — ES6 класс, экспортируемый как **синглтон** (`export default`).
- Внутри методов — маппинг ответа: `snake_case` (бэкенд) → `camelCase` (фронтенд).
- API-модуль на домен: `UserAPI`, `OrderAPI`, `ProductAPI` и т.д.

---

## Redux (`features/` + `store/`)

### Конфигурация store

```
store/
└── store.js                      # configureStore({ reducer: { <name>: <reducer>, ... } })
```

### Структура фича-модуля

Простая фича — один файл. Сложная — папка:

```
features/
├── simpleReducer.js              # createSlice в одном файле
│                                 #   export default slice.reducer
│                                 #   export const { action1, action2 } = slice.actions
│
├── <featureName>Reducer.js       # Barrel-файл: реэкспорт из папки
└── <featureName>/
    ├── constants.js              # initialState, начальные данные
    ├── slice.js                  # createSlice: reducers + extraReducers (builder)
    ├── thunks.js                 # createAsyncThunk
    ├── selectors.js              # createSelector
    └── stateMappers.js           # Чистые функции для мутации state в reducers
```

**Соглашения:**
- Reducer экспортируется как `export default`.
- Actions экспортируются как named: `export const { setX, resetY } = slice.actions`.
- Thunks используют `rejectWithValue` для ошибок.
- В `extraReducers` обрабатываются `fulfilled` и `rejected` (pending — по необходимости).

---

## Layout-шаблоны (`templates/`)

По одному шаблону на каждую роль / раздел.

```
templates/
├── auth.jsx                      # <Outlet /> без навигации
├── <role>.jsx                    # <Outlet /> + <Menu> с пунктами для этой роли
└── ...
```

Шаблон — это обёртка с `<Outlet />` и нижним меню. Подключается в `routerConfig` как `element` корневого маршрута роли.

---

## Хуки (`hooks/`)

Глобальные хуки общего назначения. Хуки, привязанные к конкретному компоненту, лежат **в файле компонента**.

```
hooks/
├── useAnimatedNavigate.js        # Навигация (обёртка над useNavigate)
├── useOpenPage.js                # Хелпер для onClick-навигации
└── use<Name>.js                  # Любой глобальный хук
```

---

## Утилиты (`utils/`)

Чистые функции без React-зависимостей.

```
utils/
├── authStorage.js                # Работа с токенами в localStorage
├── emailValidation.js            # Валидация данных
├── formatDate.js                 # Форматирование
├── downloadFile.js               # Работа с файлами
└── ...
```

---

## Конфигурация (`config/`)

```
config/
├── constants.js                  # Глобальные константы
├── routerConfig.js               # Полная конфигурация маршрутов (createBrowserRouter)
└── <domain>Config.js             # Доменные конфигурации (по необходимости)
```

---

## Глобальные стили

```
pages/app/
├── zeroStyle.css                 # CSS reset + шрифт
├── colorScheme.css               # :root { --app-bg-color, --app-accent-color, ... }
└── pageStyle.css                 # Глобальные layout-классы (.page_container, .page_content)
```

Импортируются в `app.jsx` без модульного синтаксиса (`import "./zeroStyle.css"`).

---

## Маршрутизация (обобщённая схема)

```
/                   → App (auth guard, загрузка пользователя, <Outlet>)
│
├── /               → <RoleTemplate> (Outlet + Menu)
│   ├── /                → DashboardPage
│   ├── /<section>       → SectionPage
│   └── /<section>/:id   → DetailPage
│
├── /<role-2>       → <Role2Template> (Outlet + Menu)
│   ├── /<role-2>             → ListPage
│   └── /<role-2>/:entityId/* → CRUD-страницы
│
├── /auth           → AuthTemplate (Outlet, без меню)
│   ├── /auth/login
│   └── /auth/register
│
└── *               → Navigate to /
```

**Принципы:**
- Один файл `src/app/routes.tsx` — единая точка конфигурации всех маршрутов.
- Layout-роуты (`<Template>`) оборачивают группу страниц через `children` + `<Outlet>`.
- Auth guard реализуется в `RequireAuth` внутри `routes.tsx`.
- Навигация — только через `useAnimatedNavigate()`.

---

## Чек-лист: добавление нового модуля

| Шаг | Действие | Путь |
|-----|----------|------|
| 1 | Создать папку страницы | `src/pages/<role>/<pageName>/` |
| 2 | Создать компонент + стили | `<pageName>.jsx` + `<pageName>.module.css` |
| 3 | Зарегистрировать маршрут | `src/app/routes.tsx` |
| 4 | Описать типы домена | `src/types/<domain>.ts` |
| 5 | Добавить mock-данные | `src/mock/mockData.ts` |
| 6 | Добавить atom при необходимости | `src/store/atoms.ts` |
| 7 | Создать общий компонент (если переиспользуется) | `src/components/<name>/` |

---
---

# Часть 2. Исторический слепок Barista (legacy, только для справки)

> Ниже приведён архивный слепок старого проекта; для нового кода ориентируйся на Часть 1 и `PROJECT.md`.
> Все пути, файлы и аннотации основаны на реальном содержимом проекта.

## Технический стек

| Категория | Технология |
|-----------|-----------|
| Язык | JavaScript (JSX). TypeScript **не используется** |
| Фреймворк | React 19 (CRA — react-scripts 5) |
| Стейт | Redux Toolkit 2 + react-redux 9 |
| Роутинг | react-router 7 (`createBrowserRouter`) |
| HTTP-клиент | axios 1.12 (класс-обёртка `APIClient`) |
| Стилизация | CSS Modules (`.module.css`) + глобальные CSS |
| Утилиты стилей | classnames 2 |
| Rich-текст | draft-js + draft-js-export-html / import-html |
| DnD | @dnd-kit/core + sortable + modifiers |
| Сборка | react-scripts (Webpack) |

---

## Архитектурный паттерн

Проект организован по **ролевому** принципу:

```
pages/
├── user/          # Страницы обычного сотрудника
├── admin/         # Страницы администратора кафе
├── superadmin/    # Страницы суперадминистратора
├── auth/          # Аутентификация (login, register, OTP, 2FA)
├── policy/        # Политика конфиденциальности / соглашение
└── app/           # Корневой компонент + глобальные стили
```

Компоненты, используемые на нескольких страницах, лежат в `src/components/`.
Компоненты, используемые только на одной странице, лежат **рядом** с файлом страницы
(например `InputBlock.jsx`, `checkListItem.jsx`, `weekDayPopup.jsx`).

Шаблоны-обёртки (layout) лежат в `src/templates/` — по одному на роль.

---

## Полное дерево файлов

```
frontend/
├── package.json                          # Зависимости и npm-скрипты
├── package-lock.json
├── nginx.conf                            # Конфигурация nginx для продакшн-сборки
│
├── public/
│   └── manifest.json                     # PWA-манифест
│
└── src/
    ├── index.js                          # ТОЧКА ВХОДА: ReactDOM.createRoot,
    │                                     #   оборачивает Redux <Provider> + <RouterProvider>
    │
    ├── api/                              # API-слой — классы-обёртки над axios
    │   ├── APIClient.js                  # axios.create, interceptors (auth, refresh),
    │   │                                 #   методы get/post/patch/put/delete.
    │   │                                 #   Экспорт: API (инстанс), filterData (утилита)
    │   ├── AdminAPI.js                   # Запросы администратора кафе
    │   ├── AuthAPI.js                    # login, register, refresh, OTP, 2FA
    │   ├── CheckListAPI.js              # Чек-листы и задачи
    │   ├── IncomeAPI.js                  # Доходы / зарплата
    │   ├── KnowledgeAPI.js              # База знаний (материалы, тесты, видео)
    │   ├── KpiAPI.js                     # KPI-задачи и отчёты
    │   ├── LegalAPI.js                   # Юридические документы
    │   ├── MainPageAPI.js               # Данные главной страницы
    │   ├── MotivationAPI.js             # Мотивация сотрудников
    │   ├── SuperAdminAPI.js             # Запросы суперадмина
    │   ├── TableAPI.js                   # Табель смен
    │   └── UserAPI.js                    # Пользователь: инфо, статус, фото, пароль
    │
    ├── assets/
    │   └── icons.jsx                     # SVG-иконки как React-компоненты
    │
    ├── components/                       # ПЕРЕИСПОЛЬЗУЕМЫЕ UI-компоненты
    │   ├── accordion/                    # Аккордеон (разворачиваемый блок)
    │   │   ├── accordion.jsx
    │   │   └── accordion.module.css
    │   ├── adminHeader/                  # Шапка для админ-страниц (с кнопкой назад)
    │   │   ├── adminHeader.jsx
    │   │   └── adminHeader.module.css
    │   ├── button/                       # Универсальная кнопка (primary/secondary/destructive/info/hint/done)
    │   │   ├── button.jsx
    │   │   └── button.module.css
    │   ├── calendar/                     # Календарь со сменами
    │   │   ├── calendar.jsx
    │   │   ├── calendarDay.jsx           # Компонент одного дня
    │   │   └── calendar.module.css
    │   ├── checkbox/                     # Чекбокс
    │   │   ├── checkbox.jsx
    │   │   └── checkbox.module.css
    │   ├── draggableItem/               # DnD: перетаскиваемый элемент (@dnd-kit)
    │   │   └── draggableItem.jsx
    │   ├── droppableZone/               # DnD: зона для сброса
    │   │   └── droppableZone.jsx
    │   ├── editableAdminInfo/           # Редактируемая информация администратора
    │   │   ├── editableAdminInfo.jsx
    │   │   └── editableAdminInfo.module.css
    │   ├── editableHeader/              # Редактируемый заголовок (inline-edit)
    │   │   ├── editableHeader.jsx
    │   │   └── editableHeader.module.css
    │   ├── editableUserInfo/            # Редактируемая карточка пользователя (фото, имя)
    │   │   ├── editableUserInfo.jsx
    │   │   └── editableUserInfo.module.css
    │   ├── errorBoundary/               # React Error Boundary для корневого маршрута
    │   │   ├── errorBoundary.jsx
    │   │   └── error.module.css
    │   ├── graph/                        # Вертикальная столбчатая диаграмма
    │   │   ├── graph.jsx
    │   │   ├── graphItem.jsx
    │   │   └── graph.module.css
    │   ├── header/                       # Шапка для user-страниц (с аватаром и уровнем)
    │   │   ├── header.jsx
    │   │   └── header.module.css
    │   ├── htmlPreview/                 # Безопасный рендеринг HTML-контента (DOMPurify)
    │   │   └── htmlPreview.jsx
    │   ├── image/                        # Компонент изображения с плейсхолдером
    │   │   ├── image.jsx
    │   │   └── image.module.css
    │   ├── imageGrid/                   # Сетка изображений
    │   │   ├── imageGrid.jsx
    │   │   └── imageGrid.module.css
    │   ├── incomeFormulaItem/           # Элемент формулы дохода
    │   │   ├── incomeFormulaItem.jsx
    │   │   └── incomeFormulaItem.module.css
    │   ├── input/                        # Текстовое поле ввода (с label, error, пароль)
    │   │   ├── input.jsx
    │   │   └── input.module.css
    │   ├── inputWithOptions/            # Инпут с выпадающим списком опций
    │   │   ├── InputWithOptions.jsx
    │   │   └── inputWithOptions.module.css
    │   ├── loader/                       # Спиннер и полноэкранный лоадер
    │   │   ├── loader.jsx                # SVG-спиннер
    │   │   ├── pageLoader.jsx            # Полноэкранный лоадер
    │   │   └── loader.module.css
    │   ├── mediaSlider/                 # Слайдер медиа (свайпы, react-swipeable)
    │   │   ├── mediaSlider.jsx
    │   │   └── mediaSlider.module.css
    │   ├── menu/                         # Нижнее навигационное меню
    │   │   ├── menu.jsx                  # Контейнер меню
    │   │   ├── menuItem.jsx              # Один пункт меню (NavLink)
    │   │   └── menu.module.css
    │   ├── numberInput/                 # Числовое поле ввода (±)
    │   │   ├── numberInput.jsx
    │   │   └── numberInput.module.css
    │   ├── popup/                        # Модальное окно (снизу на мобилке, центр на десктопе)
    │   │   ├── popup.jsx                 # Popup + usePopup хук
    │   │   ├── popup.module.css
    │   │   └── confirmPopup/            # Подтверждающий popup (useConfirmPopup)
    │   │       ├── confirmPopup.jsx
    │   │       └── confirmPopup.module.css
    │   ├── profileInfo/                 # Блок информации профиля
    │   │   ├── profileInfo.jsx
    │   │   └── profileInfo.module.css
    │   ├── progressBar/                 # Горизонтальный прогресс-бар
    │   │   ├── progressBar.jsx
    │   │   └── progressBar.module.css
    │   ├── progressCircle/              # Круговой индикатор прогресса (SVG)
    │   │   ├── progressCircle.jsx
    │   │   └── progressCircle.module.css
    │   ├── progressLine/                # Линейный индикатор прогресса
    │   │   ├── progressLine.jsx
    │   │   └── progressLine.module.css
    │   ├── range/                        # Ползунок (range input)
    │   │   ├── range.jsx
    │   │   └── range.module.css
    │   ├── rawTextEditor/               # Простой textarea-редактор
    │   │   ├── rawTextEditor.jsx
    │   │   └── rawTextEditor.module.css
    │   ├── rawTextPreview/              # Превью текста
    │   │   ├── rawTextPreview.jsx
    │   │   └── rawTextPreview.module.css
    │   ├── retractable/                 # Анимированный collapse (свернуть/развернуть)
    │   │   ├── retractable.jsx
    │   │   └── retractable.module.css
    │   ├── rewards/                      # Блок достижений / наград
    │   │   ├── rewards.jsx
    │   │   ├── rewardCard.jsx
    │   │   └── rewards.module.css
    │   ├── scrollable/                  # Горизонтально скроллируемый контейнер
    │   │   ├── scrollable.jsx
    │   │   └── scrollable.module.css
    │   ├── scrollableMenu/              # Горизонтальное меню-табы
    │   │   ├── scrollableMenu.jsx
    │   │   └── scrollableMenu.module.css
    │   ├── separator/                   # Вертикальный отступ (spacer)
    │   │   ├── separator.jsx
    │   │   └── separator.module.css
    │   ├── spring/                       # Flex-пружина (заполняет оставшееся пространство)
    │   │   ├── spring.jsx
    │   │   └── spring.module.css
    │   ├── text/                         # Типографический компонент <Text>
    │   │   ├── text.jsx                  # view-система: title, subtitle, heading, body, caption...
    │   │   └── text.module.css           # CSS-переменные --text-font-size, --text-font-weight и т.д.
    │   ├── textEditor/                  # Rich-text редактор (Draft.js)
    │   │   ├── textEditor.jsx            # Компонент TextEditor + хук useTextEditor
    │   │   ├── textEditorToolbar.jsx     # Панель инструментов
    │   │   ├── atomicCommands.js         # Команды для atomic-блоков
    │   │   ├── atomicImage.jsx           # Рендер изображений в редакторе
    │   │   ├── autoLink.js               # Автоматические ссылки
    │   │   ├── linkDecorator.jsx         # Декоратор ссылок
    │   │   ├── linkPopup.jsx             # Попап добавления ссылки
    │   │   ├── linkRanges.js             # Утилиты для работы со ссылками
    │   │   └── textEditor.module.css
    │   ├── textInput/                   # Альтернативный текстовый инпут
    │   │   ├── textInput.jsx
    │   │   ├── textInput.js              # Дублирующий / legacy файл
    │   │   └── textInput.module.css
    │   ├── uploadFile/                  # Загрузка одного файла
    │   │   ├── uplodeFile.jsx            # (typo в имени файла)
    │   │   └── uploadFile.module.css
    │   ├── uploadFiles/                 # Загрузка нескольких файлов
    │   │   ├── uplodeFiles.jsx           # (typo в имени файла)
    │   │   └── uploadFile.module.css
    │   ├── video/                        # Видеоплеер
    │   │   ├── video.jsx
    │   │   └── video.module.css
    │   └── zoomableImage/               # Увеличиваемое изображение
    │       ├── zoomableImage.jsx
    │       └── zoomableImage.module.css
    │
    ├── config/                           # Конфигурация приложения
    │   ├── constants.js                  # Глобальные константы (DEFAULT_ICON)
    │   ├── levelNames.js                 # Названия и пороги уровней
    │   └── routerConfig.js               # Конфигурация всех маршрутов (762 строки)
    │
    ├── features/                         # Redux: слайсы и реэкспорты
    │   ├── statusReducer.js              # Слайс статуса ролей (isUser/isAdmin/isSuperAdmin)
    │   ├── userReducer.js                # Реэкспорт всего из user/ (barrel-файл)
    │   └── user/                         # Основной фича-модуль пользователя
    │       ├── constants.js              # initialState, initialUserData, initialAdminData
    │       ├── slice.js                  # createSlice: reducers + extraReducers
    │       ├── thunks.js                 # createAsyncThunk: fetchUserInfo, fetchAdminInfo и др.
    │       ├── selectors.js              # createSelector: selectUserState, selectUserData и др.
    │       └── stateMappers.js           # Чистые функции-маперы для обновления state
    │
    ├── hooks/                            # Кастомные хуки
    │   ├── useAnimatedNavigate.js        # Навигация с View Transitions API
    │   ├── useOpenPage.js                # Хелпер: возвращает () => navigate(url)
    │   └── useScrollToTop.js             # Скролл в начало при смене pathname
    │
    ├── pages/                            # СТРАНИЦЫ, сгруппированные по ролям
    │   ├── app/                          # Корневой layout
    │   │   ├── app.jsx                   # <App>: аутентификация, редиректы по ролям, <Outlet>
    │   │   ├── colorScheme.css           # :root CSS-переменные (цветовая схема)
    │   │   ├── pageStyle.css             # Глобальные классы (.page_container, .page_content)
    │   │   └── zeroStyle.css             # CSS reset + шрифт Inter
    │   │
    │   ├── auth/                         # Страницы аутентификации
    │   │   ├── _styles/
    │   │   │   └── authPage.module.css   # Общие стили для auth-страниц
    │   │   ├── login/
    │   │   │   └── loginPage.jsx
    │   │   ├── loginOtp/
    │   │   │   └── loginOtpPage.jsx      # Подтверждение OTP-кодом
    │   │   ├── register/
    │   │   │   └── registerPage.jsx
    │   │   ├── twoFactor/
    │   │   │   └── twoFactorPage.jsx     # Управление 2FA
    │   │   └── updatePassword/
    │   │       └── updatePassword.jsx
    │   │
    │   ├── policy/                       # Политики
    │   │   ├── policy.jsx                # Общий компонент отображения документа
    │   │   ├── policy.module.css
    │   │   ├── userPolicy.jsx            # Пользовательское соглашение
    │   │   └── adminPolicy.jsx           # Соглашение для администратора
    │   │
    │   ├── admin/                        # ~30 папок — страницы администратора кафе
    │   │   ├── addCategory/              # Создание категории базы знаний
    │   │   ├── addKpiTask/               # Создание KPI-задачи
    │   │   ├── addMaterial/              # Создание учебного материала
    │   │   ├── addTest/                  # Создание теста
    │   │   ├── addWorkerShiftPage/       # Добавление смены сотруднику
    │   │   ├── adminCheckList/           # Чек-лист задач админа
    │   │   ├── adminTablePage/           # Табель смен (общий по кафе)
    │   │   ├── adminTaskAddPage/         # Создание задачи для себя
    │   │   ├── cafeChecklistSettings/    # Настройки зон чек-листа
    │   │   ├── cafeFaq/                  # FAQ кафе
    │   │   ├── cafeInfo/                 # Информация о кафе
    │   │   ├── cafeKPIPage/              # KPI-прогресс
    │   │   ├── cafeList/                 # Список кафе
    │   │   ├── cafeMotivationPage/       # Мотивация кафе
    │   │   ├── cafeReportsPage/          # Отчёты кафе
    │   │   ├── createReportPage/         # Создание отчёта
    │   │   ├── documentsPage/            # Документы
    │   │   ├── editKpiTask/              # Редактирование KPI-задачи
    │   │   ├── editMaterial/             # Редактирование материала
    │   │   ├── editTest/                 # Редактирование теста
    │   │   ├── knowledgeBasePage/        # База знаний (список категорий)
    │   │   ├── knowledgeBaseTestsPage/   # Тесты категории
    │   │   ├── profilePage/              # Профиль администратора
    │   │   ├── revenueReports/           # Отчёты о выручке
    │   │   ├── workerCard/               # Карточка сотрудника
    │   │   ├── workerCheckListPage/      # Чек-лист сотрудника
    │   │   ├── workerChecklistTaskPage/  # Задача чек-листа сотрудника
    │   │   ├── workerMotivationPage/     # Мотивация сотрудника
    │   │   ├── workerReportsPage/        # Отчёты сотрудника
    │   │   ├── workersList/              # Список сотрудников
    │   │   ├── workerTablePage/          # Табель сотрудника
    │   │   ├── workerTaskAddPage/        # Добавление задачи сотруднику
    │   │   └── workerTaskEditPage/       # Редактирование задачи
    │   │
    │   ├── superadmin/                   # ~25 папок — страницы суперадминистратора
    │   │   ├── addCafe/                  # Создание нового кафе
    │   │   ├── addCategory/
    │   │   ├── addKpiTask/
    │   │   ├── addMaterial/
    │   │   ├── addTest/
    │   │   ├── adminCheckList/
    │   │   ├── cafeChecklistSettings/
    │   │   ├── cafeFaq/
    │   │   ├── cafeInfo/
    │   │   ├── cafeKPIPage/
    │   │   ├── cafeList/
    │   │   ├── cafeReportsPage/
    │   │   ├── cafeTablePage/
    │   │   ├── cafeWorkers/
    │   │   ├── editCafeInfo/
    │   │   ├── editKpiTask/
    │   │   ├── editMaterial/
    │   │   ├── editTest/
    │   │   ├── knowledgeBasePage/
    │   │   ├── knowledgeBaseTestsPage/
    │   │   ├── profilePage/
    │   │   ├── workerCard/
    │   │   ├── workerCheckListPage/
    │   │   ├── workerChecklistTaskPage/
    │   │   ├── workerMotivationPage/
    │   │   ├── workerReportsPage/
    │   │   └── workerTablePage/
    │   │
    │   └── user/                         # ~18 папок — страницы сотрудника
    │       ├── addReportPage/
    │       ├── checkListPage/
    │       ├── checklistTaskPage/
    │       ├── documentsPage/
    │       ├── experts/
    │       ├── faqPage/
    │       ├── incomePage/
    │       ├── knowledgeBaseMaterialPage/
    │       ├── knowledgeBasePage/
    │       ├── knowledgeBaseTestPage/
    │       ├── knowledgeBaseTestsPage/
    │       ├── mainPage/                 # Главная: приветствие, прогресс, карта действий
    │       ├── motivationPage/
    │       ├── profilePage/
    │       ├── reportsPage/
    │       ├── subscribePage/
    │       ├── tablePage/
    │       └── tasksPage/
    │
    ├── store/                            # Redux store
    │   └── store.js                      # configureStore({ user, status })
    │
    ├── templates/                        # Layout-шаблоны по ролям
    │   ├── auth.jsx                      # <Outlet> без меню
    │   ├── user.jsx                      # <Outlet> + нижнее меню (5 пунктов)
    │   ├── admin.jsx                     # <Outlet> + нижнее меню (зависит от cafeId)
    │   └── superadmin.jsx                # <Outlet> + нижнее меню (3 пункта)
    │
    └── utils/                            # Утилитарные функции
        ├── addDays.js                    # Добавить N дней к дате
        ├── addMonths.js                  # Добавить N месяцев к дате
        ├── alertMessage.js               # window.alert обёртка
        ├── authStorage.js                # localStorage: access/refresh токены
        ├── copyToClipboard.js            # Копирование в буфер обмена
        ├── downloadFile.js               # Скачивание файла через <a>
        ├── emailValidation.js            # Валидация email (regex + RFC-логика)
        ├── generateUniqueFilename.js     # Уникальное имя файла с timestamp
        ├── getStrDate.js                 # Форматирование даты (ДД.ММ, ДД.ММ.ГГГГ)
        ├── getStrTime.js                 # Форматирование времени (ЧЧ:ММ)
        ├── numberWithSpaces.js           # Число с пробелами-разделителями
        ├── openExternalLink.js           # Открытие внешней ссылки в новой вкладке
        └── reduxUser.js                  # Прямой доступ к store.getState().user
```

---

## Структура типичной папки страницы

```
pages/admin/workerTaskAddPage/
├── workerTaskAddPage.jsx        # Основной компонент страницы
├── workerTaskAddPage.module.css # Стили страницы
├── InputBlock.jsx               # Частный компонент (только для этой страницы)
└── repeatTabs.js                # Данные/константы (только для этой страницы)
```

## Структура типичной папки компонента

```
components/button/
├── button.jsx                   # Компонент
└── button.module.css            # Стили
```

---

## Провайдеры приложения (index.js)

```
<Provider store={store}>         ← Redux
  <RouterProvider router={router} />  ← React Router
</Provider>
```

## Иерархия маршрутов (упрощённо)

```
/                → App (auth guard + Outlet)
├── /            → UserTemplate (Outlet + Menu)
│   ├── /              → MainPage
│   ├── /tasks         → TasksPage
│   ├── /income        → IncomePage
│   ├── /profile/*     → ProfilePage, FAQ, Subscribe, Motivation, Table, Reports, Documents
│   ├── /knowledge/*   → KnowledgeBase, Tests, Materials, Experts
│   └── /checklist/*   → CheckListPage, ChecklistTask
│
├── /admin       → AdminTemplate (Outlet + Menu)
│   ├── /admin              → AdminCafeListPage
│   ├── /admin/profile      → AdminProfilePage
│   └── /admin/:cafeId/*    → CafeInfo, Employees, Table, KPI, Tasks, Knowledge, Reports...
│
├── /superadmin  → SuperAdminTemplate (Outlet + Menu)
│   ├── /superadmin/cafe/*        → CafeList, CafeInfo, Employees, Table, KPI, Knowledge...
│   ├── /superadmin/knowledge/*   → KnowledgeBase (глобальная)
│   └── /superadmin/profile       → SuperAdminProfilePage
│
├── /auth        → AuthTemplate (Outlet, без меню)
│   ├── /auth/login         → LoginPage
│   ├── /auth/register      → RegisterPage
│   ├── /auth/login-otp     → LoginOtpPage
│   ├── /auth/updatePassword → UpdatePasswordPage
│   └── /auth/twoFactor     → TwoFactorPage
│
├── /invite/:inviteToken    → AuthTemplate → RegisterPage
├── /user_policy            → UserPolicyPage
├── /admin_policy           → AdminPolicyPage
└── *                       → Navigate to /
```
