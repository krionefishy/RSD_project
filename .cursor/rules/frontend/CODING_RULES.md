# CODING RULES

> Правила для работы с существующим проектом и для создания аналогичного с нуля.
> Каждое правило основано на реальных паттернах из кодовой базы.
>
> **Категории A–J** — правила работы внутри проекта.
> **Категории K–T** — правила для создания проекта с нуля (bootstrap).

---

## Категория A: Создание новых страниц

### A.1 Где создавать файл страницы

Страница создаётся в отдельной папке внутри `src/pages/<роль>/`, где `<роль>` — это `user`, `admin` или `superadmin`.

Имя папки — **camelCase**, совпадает с логическим названием страницы.

**Где взять пример:** `src/pages/admin/revenueReports/`

```
src/pages/admin/revenueReports/
├── revenueReports.jsx
└── revenueReports.module.css
```

### A.2 Шаблон компонента страницы

Страница — это функциональный компонент с **named export**. Используются хуки Redux (`useSelector`, `useDispatch`), навигация через `useAnimatedNavigate`, API-вызовы в `useEffect`.

**Где взять пример:** `src/pages/user/checkListPage/checkListPage.jsx`

```jsx
import { useLocation } from "react-router"
import { Header } from "../../../components/header/header"
import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { ScrollableMenu } from "../../../components/scrollableMenu/scrollableMenu"
import { PageLoader } from "../../../components/loader/pageLoader"
import CheckListAPI from "../../../api/CheckListAPI"
import qs from "qs";
import { Text } from "../../../components/text/text";
import styles from "./checkList.module.css"

export const CheckListPage = () => {
    const { search } = useLocation();
    const searchParams = qs.parse(search.replace("?", ""));
    const cafeId = useSelector(state => state?.user?.userData?.cafeId);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!cafeId) return;
        CheckListAPI
            .fetchUserChecklistCategories()
            .then((res) => setChecklistCategories(res))
            .catch(console.error)
            .finally(() => setPageLoading(false));
    }, [cafeId]);

    if (pageLoading) {
        return <PageLoader />;
    }

    return (
        <>
            <Header title="Чек-Лист" />
            {/* контент */}
        </>
    )
}
```

### A.3 Как зарегистрировать маршрут

Все маршруты объявлены в **одном файле** — `src/config/routerConfig.js`.

1. Импортировать компонент страницы в начало файла.
2. Добавить объект `{ path: "...", element: <Component /> }` в соответствующую ветку `children`.

**Где взять пример:** `src/config/routerConfig.js` (строки 449–451)

```jsx
import { RevenueReportsPage } from "../pages/admin/revenueReports/revenueReports";
// ...
{
    path: "revenueReports",
    element: <RevenueReportsPage />
}
```

### A.4 Защита маршрутов

Отдельного компонента `ProtectedRoute` / `RequireAuth` **нет**. Защита реализована в корневом компоненте `App` (`src/pages/app/app.jsx`):

- Проверяется `getAccessToken()` из `authStorage`.
- Запрашивается `UserAPI.fetchUserStatus()`.
- При отсутствии токена или ролей — редирект на `/auth/login`.
- Роль определяет допустимые маршруты (`/`, `/admin`, `/superadmin`).

**Где взять пример:** `src/pages/app/app.jsx` (строки 37–110)

```jsx
const accessToken = getAccessToken();

if (!accessToken) {
    clearAuthSession();
    dispatch(resetUserState());
    dispatch(setStatus({ isUser: false, isAdmin: false, isSuperAdmin: false }));
    if (!isAuthRoute) {
        navigate("/auth/login");
    }
    setLoading(false);
    return;
}

const { isUser, isAdmin, isSuperAdmin } = await UserAPI.fetchUserStatus();
dispatch(setStatus({ isUser, isAdmin, isSuperAdmin }));
```

---

## Категория B: Создание новых слайсов (Redux Toolkit)

### B.1 Где создавать файл слайса

Слайсы лежат в `src/features/`. Простые слайсы — один файл (как `statusReducer.js`). Сложные фичи — папка с разделением на файлы (как `user/`).

**Структура сложного слайса (`src/features/user/`):**

```
features/user/
├── constants.js      # initialState, initialUserData, initialAdminData
├── slice.js          # createSlice: reducers + extraReducers
├── thunks.js         # createAsyncThunk
├── selectors.js      # createSelector
└── stateMappers.js   # Чистые функции-маперы для мутации state
```

**Barrel-файл:** `src/features/userReducer.js` реэкспортирует всё из `user/`.

### B.2 Структура слайса

**Где взять пример:** `src/features/user/slice.js`

```jsx
import { createSlice } from "@reduxjs/toolkit";
import { initialAdminData, initialState, initialUserData } from "./constants";
import { applyCommonUserData, applyUserData, applyAdminCafeList } from "./stateMappers";
import { fetchAdminChecklistId, fetchAdminInfo, fetchCafes, fetchChecklistID, fetchUserInfo, updateUserExp } from "./thunks";

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserProgress: (state, action) => {
            state.userData.level = action.payload.newLevel;
            state.userData.totalExp = action.payload.newExp;
        },
        resetUserState: () => {
            return { ...initialState, userData: { ...initialUserData }, adminData: { ...initialAdminData } };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUserInfo.fulfilled, (state, action) => {
            applyCommonUserData(state, action.payload);
            applyUserData(state, action.payload);
            state.loaded = true;
        });
        builder.addCase(fetchUserInfo.rejected, (state) => {
            state.loaded = true;
        });
    }
});

export const { setUserProgress, resetUserState } = userSlice.actions;
export default userSlice.reducer;
```

### B.3 Как зарегистрировать слайс в store

Добавить импорт редьюсера и ключ в `configureStore` в `src/store/store.js`.

**Где взять пример:** `src/store/store.js`

```jsx
import { configureStore } from "@reduxjs/toolkit";
import UserReducer from "../features/userReducer.js";
import StatusReducer from "../features/statusReducer.js";

export const store = configureStore({
    reducer: {
        user: UserReducer,
        status: StatusReducer,
    }
});
```

### B.4 Как создать createAsyncThunk

**Где взять пример:** `src/features/user/thunks.js`

```jsx
import { createAsyncThunk } from "@reduxjs/toolkit";
import UserAPI from "../../api/UserAPI";

export const fetchUserInfo = createAsyncThunk(
    "user/fetchUserInfo",
    async (_, { rejectWithValue }) => {
        try {
            const userData = await UserAPI.fetchUserInfo();
            return userData;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);
```

Паттерн обработки: в `extraReducers` используются **только `fulfilled` и `rejected`**. Состояние `pending` обрабатывается только для `fetchCafes` (обнуление списка + флаг `cafesLoading`).

### B.5 Как создать селекторы

Селекторы вынесены в отдельный файл. Используется `createSelector` из `@reduxjs/toolkit`.

**Где взять пример:** `src/features/user/selectors.js`

```jsx
import { createSelector } from "@reduxjs/toolkit";

export const selectUserState = (state) => state.user;

export const selectUserData = createSelector(
    [selectUserState],
    (userState) => userState.userData
);

export const selectUserCafeId = createSelector(
    [selectUserData],
    (userData) => userData?.cafeId ?? null
);
```

### B.6 Простой слайс (один файл)

**Где взять пример:** `src/features/statusReducer.js`

```jsx
import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    isUser: false,
    isAdmin: false,
    isSuperAdmin: false,
}

const statusSlice = createSlice({
    name: "status",
    initialState,
    reducers: {
        setStatus: (state, action) => {
            state.isUser = action.payload.isUser || false;
            state.isAdmin = action.payload.isAdmin || false;
            state.isSuperAdmin = action.payload.isSuperAdmin || false;
        }
    }
});

export default statusSlice.reducer;
export const { setStatus } = statusSlice.actions;
```

---

## Категория C: Передача параметров

### C.1 Как получать параметры маршрута (useParams)

Используется повсеместно для `cafeId`, `userId`, `categoryId`, `testId`, `materialId`, `taskId`.

**Где взять пример:** `src/pages/admin/adminTaskAddPage/adminTaskAddPage.jsx` (строка 15)

```jsx
import { useParams } from "react-router";

const { cafeId } = useParams();
```

### C.2 Как получать query-параметры

Два подхода используются в проекте:

**Подход 1: `useSearchParams` из react-router**

**Где взять пример:** `src/pages/auth/login/loginPage.jsx` (строки 29–32)

```jsx
import { useSearchParams } from "react-router";

const [searchParams] = useSearchParams();
const inviteToken = useMemo(() => {
    return searchParams.get("inviteToken") || null;
}, [searchParams]);
```

**Подход 2: `qs` + `useLocation`**

**Где взять пример:** `src/pages/user/checkListPage/checkListPage.jsx` (строки 17–18)

```jsx
import qs from "qs";
const { search } = useLocation();
const searchParams = qs.parse(search.replace("?", ""));
```

### C.3 Как передавать state через навигацию

Навигация осуществляется через кастомный хук `useAnimatedNavigate`, который оборачивает `navigate` из react-router в `document.startViewTransition`.

**Где взять пример:** `src/hooks/useAnimatedNavigate.js`

```jsx
import { useCallback } from "react";
import { useNavigate } from "react-router";

export const useAnimatedNavigate = () => {
    const navigate = useNavigate();
    return useCallback((url) => {
        try {
            if (!document.startViewTransition) {
                navigate(url);
            } else {
                document.startViewTransition(() => {
                    navigate(url);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }, [navigate]);
}
```

Параметры передаются через URL (query string или path params). `location.state` **не используется** в проекте.

### C.4 Как читать и изменять глобальный стейт

Чтение: `useSelector` (инлайн-селектор или именованный из `selectors.js`).

**Где взять пример:** `src/pages/user/mainPage/mainPage.jsx`

```jsx
import { useSelector } from "react-redux";

const userName = useSelector(state => state?.user?.name) || "Имя пользователя";
const cafeId = useSelector(state => state?.user?.userData?.cafeId);
```

Запись: `useDispatch` + actions из слайса или thunk.

```jsx
import { useDispatch } from "react-redux";
import { setStatus } from "../features/statusReducer";

const dispatch = useDispatch();
dispatch(setStatus({ isUser, isAdmin, isSuperAdmin }));
```

---

## Категория D: Создание общих компонентов

### D.1 Структура папки компонента

Каждый компонент — папка в `src/components/` с именем в **camelCase**.

```
components/button/
├── button.jsx
└── button.module.css
```

Для компонентов с подкомпонентами:

```
components/popup/
├── popup.jsx           # Popup + usePopup
├── popup.module.css
└── confirmPopup/       # Подкомпонент
    ├── confirmPopup.jsx
    └── confirmPopup.module.css
```

### D.2 Как типизировать пропсы

Проект на JavaScript — типизация отсутствует. Пропсы **деструктурируются** в сигнатуре функции с **дефолтными значениями**.

**Где взять пример:** `src/components/button/button.jsx`

```jsx
export const Button = ({
    className,
    text,
    view = "normal",
    icon,
    type = "primary",
    noActiveAnimation = false,
    fixed,
    buttonType = "button",
    error,
    ...params
}) => { /* ... */ }
```

### D.3 Как экспортировать

Компоненты используют **named export** (`export const Component`). Дефолтный экспорт **не используется** для компонентов.

**Где взять пример:** `src/components/input/input.jsx`

```jsx
export const Input = ({ type, value, setValue, error, label, ...props }) => {
    // ...
}
```

### D.4 Как стилизовать

CSS Modules + `classnames` (см. категорию F).

---

## Категория E: Создание частных компонентов

### E.1 Где создавать

Частные компоненты создаются **в той же папке**, что и страница, которая их использует.

**Где взять пример:** `src/pages/admin/adminTaskAddPage/`

```
adminTaskAddPage/
├── adminTaskAddPage.jsx        # Страница
├── adminTaskAddPage.module.css
├── InputBlock.jsx              # Частный компонент
└── repeatTabs.js               # Частные данные/константы
```

### E.2 Правила именования

- Файл частного компонента — **camelCase** или **PascalCase** (оба встречаются: `checkListItem.jsx`, `InputBlock.jsx`).
- Частный компонент экспортируется как `export const`, но импортируется **только** из файла страницы рядом.

### E.3 Что запрещено

- Частные компоненты **не импортируются** за пределами своей папки страницы.
- У них **нет собственного файла стилей** — они используют стили родительской страницы.

**Где взять пример:** `src/pages/admin/adminTaskAddPage/adminTaskAddPage.jsx` (строка 21)

```jsx
const InputBlock = ({ type, title, value, setValue, className, min, max, error }) => {
    return (
        <div className={classNames(styles.inputBlock, className)}>
            <Text as="div" variant="h3" className={styles.inputBlockTitle} size={14}>
                {title}
            </Text>
            {type === "number" && <NumberInput error={error} val={value} setVal={setValue} min={min} max={max} />}
            {type !== "number" && <Input error={error} type={type} value={value} setValue={setValue} />}
        </div>
    )
}
```

---

## Категория F: Стилизация

### F.1 Метод стилизации

**CSS Modules** (`.module.css`). Стили импортируются как объект `styles`.

**Где взять пример:** `src/components/header/header.jsx`

```jsx
import styles from "./header.module.css";

<header className={styles.header}>
    <Text tag="h1" view="title" className={styles.header_title} clamp={2}>{title}</Text>
</header>
```

### F.2 Именование CSS-классов

Преобладает **snake_case**: `custom_button`, `header_user_info`, `page_container`, `menu_item_icon`.

Исключение: файл `authPage.module.css` использует camelCase (`errorText`).

Модификаторы — через **составные селекторы** (`.custom_button.primary`, `.custom_button.with_icon`), а не BEM.

**Где взять пример:** `src/components/button/button.module.css`

```css
.custom_button {
    padding: 17px;
    border-radius: 14px;
    width: 100%;
}

.custom_button.primary {
    background-color: var(--app-button-color);
}

.custom_button.with_icon {
    padding: 14px;
    display: flex;
    justify-content: space-between;
}
```

### F.3 Глобальные CSS-переменные

Все переменные объявлены в `:root` в `src/pages/app/colorScheme.css`. Именование: `--app-<назначение>`.

**Где взять пример:** `src/pages/app/colorScheme.css`

```css
:root {
    --app-bg-color: #FFF;
    --app-text-color: #000;
    --app-accent-color: #F68D2B;
    --app-destructive-color: #E54646;
    --app-correct-color: #22C55E;
    --app-button-color: var(--app-accent-color);
    --app-hint-color: rgba(0, 0, 0, .05);
    --app-border-color: #C0C0C0;
    /* ... ~40 переменных */
}
```

### F.4 Как использовать CSS-переменные

**Где взять пример:** `src/components/input/input.module.css`

```css
.input_container {
    border: 1px solid var(--app-border-color);
}

.input_container:focus-within {
    border-color: var(--app-accent-color);
}

.error {
    border-color: var(--app-destructive-color);
}
```

### F.5 Адаптивность (media queries)

Единственный брейкпоинт: `@media screen and (min-width: 768px)`. Используется для перехода от мобильного к десктопному layout.

**Где взять пример:** `src/pages/app/pageStyle.css` (строки 92–103)

```css
@media screen and (min-width: 768px) {
    .page_container {
        flex-direction: row-reverse;
        align-items: start;
        overflow: hidden;
    }

    .page_content {
        overflow-y: auto;
        max-height: 100vh;
        padding: 20px;
    }
}
```

### F.6 Использование classnames

Библиотека `classnames` используется в **~60 файлах**. Основные паттерны:

**Паттерн 1: Условные модификаторы (объект)**

**Где взять пример:** `src/components/button/button.jsx`

```jsx
import classNames from "classnames";

className={
    classNames(
        styles.custom_button,
        className,
        styles[type],
        {
            [styles.with_icon]: !!icon,
            [styles.fixed]: fixed,
            [styles.error]: error,
        }
    )
}
```

**Паттерн 2: Динамический стиль из props**

```jsx
classNames(styles.custom_button, styles[type])
// type="primary" → добавляет styles.primary
```

**Паттерн 3: Простое объединение**

**Где взять пример:** `src/pages/user/mainPage/mainPage.jsx`

```jsx
<div className={classNames(styles.middle_text_caption, { [styles.enabled]: motivationSystem })}>
```

### F.7 Глобальные утилитарные CSS-классы

Определены в `src/pages/app/pageStyle.css`:

```css
.page_container { /* flex column / row */ }
.page_content { /* max-width: 425px, padding, scroll */ }
.page_header { /* flex space-between */ }
.page_title { /* 24px bold */ }
.link { color: var(--app-accent-color); cursor: pointer; }
```

Используются в компонентах **без импорта** (глобальная область видимости через `import "./pageStyle.css"`).

### F.8 Компонент Text для типографики

Вместо прямых тегов `<h1>`, `<p>`, `<span>` используется компонент `<Text>` с системой view-пресетов.

**Где взять пример:** `src/components/text/text.jsx`

```jsx
<Text as="h1" variant="title">Заголовок</Text>
<Text as="div" variant="body" size={14}>Текст</Text>
<Text as="div" variant="caption" className={styles.label}>Подпись</Text>
```

Доступные view: `title` (24px/700), `subtitle` (18px/700), `heading` (16px/700), `body` (14px/400), `bodyStrong` (14px/700), `caption` (12px/400), `captionStrong` (12px/700), `tiny` (10px/400), `display` (40px/900).

---

## Категория G: API запросы

### G.1 Как создать API-класс

Каждый API-модуль — **ES6 класс**, экспортируемый как **синглтон** с `export default`.

**Где взять пример:** `src/api/UserAPI.js`

```jsx
import { API } from "./APIClient";

class UserAPIClass {
    async fetchUserInfo() {
        const response = await API.get(`/users/userInfo`);
        return {
            userId: response.data.user_id,
            name: response.data.name,
            cafeId: response.data.cafe_id,
            level: response.data.level,
            // ... маппинг snake_case → camelCase
        };
    }

    async updateExp(exp_count) {
        const response = await API.patch("/users/updateExp", { exp_count });
        return {
            newExp: response.data.result.new_exp_count,
            newLevel: response.data.result.new_level_status,
        };
    }
}

const UserAPI = new UserAPIClass();
export default UserAPI;
```

### G.2 Где размещать

Файлы API лежат в `src/api/`. Именование: `<Domain>API.js` (PascalCase).

Существующие модули: `AdminAPI`, `AuthAPI`, `CheckListAPI`, `IncomeAPI`, `KnowledgeAPI`, `KpiAPI`, `LegalAPI`, `MainPageAPI`, `MotivationAPI`, `SuperAdminAPI`, `TableAPI`, `UserAPI`.

### G.3 Как устроен APIClient

Центральный клиент — `src/api/APIClient.js`:

- `axios.create({ baseURL: process.env.REACT_APP_API_URL })`
- **Request interceptor**: подставляет `Bearer` токен + `emp_id` в POST/PATCH.
- **Response interceptor**: обработка `TOKEN_EXPIRED` → refresh → retry; `TOKEN_MISSING`/`TOKEN_INVALID` → redirect на login.
- Экспортирует: `API` (инстанс), `filterData` (удаление null-полей из объекта).

### G.4 Маппинг ответов (snake_case → camelCase)

Ответы бэкенда приходят в `snake_case`. Маппинг выполняется вручную в каждом API-методе.

**Где взять пример:** `src/api/AuthAPI.js` (строки 16–27)

```jsx
_mapTokenResponse(data = {}) {
    return {
        accessToken: data.access_token || null,
        refreshToken: data.refresh_token || null,
        tokenType: data.token_type || "bearer",
        expiresIn: data.expires_in || null,
        userId: data.user_id || null,
        requires2fa: Boolean(data.requires_2fa),
        challengeId: data.challenge_id || null,
    };
}
```

### G.5 Как вызывать в компоненте

**Вариант 1: Напрямую в useEffect (большинство страниц)**

```jsx
useEffect(() => {
    if (!cafeId) return;
    TableAPI
        .fetchShifts(cafeId, year, month)
        .then(res => setShifts(res))
        .catch(console.error);
}, [cafeId]);
```

**Вариант 2: Через dispatch thunk (для глобального стейта)**

```jsx
dispatch(fetchUserInfo());
dispatch(fetchAdminInfo());
```

### G.6 Загрузка файлов

Используется `FormData` для загрузки файлов.

**Где взять пример:** `src/api/UserAPI.js` (строки 153–159)

```jsx
async uploadProfilePhoto(imageFile) {
    const formData = new FormData();
    formData.append("photo", imageFile);
    const response = await API.post("/users/profilePhoto", formData);
    return response.data.profile_photo_url;
}
```

---

## Категория H: Кастомные хуки

### H.1 Где создавать

Хуки общего назначения лежат в `src/hooks/`. Хуки, привязанные к конкретному компоненту, лежат **в файле компонента** (как `usePopup` в `popup.jsx`, `useTextEditor` в `textEditor.jsx`).

### H.2 Правила именования

Файл: `use<Name>.js` (camelCase). Функция: `export const use<Name>`.

### H.3 Реальные хуки из проекта

**`useAnimatedNavigate`** — навигация с View Transitions API.

**Где взять пример:** `src/hooks/useAnimatedNavigate.js`

```jsx
import { useCallback } from "react";
import { useNavigate } from "react-router";

export const useAnimatedNavigate = () => {
    const navigate = useNavigate();
    return useCallback((url) => {
        try {
            if (!document.startViewTransition) {
                navigate(url);
            } else {
                document.startViewTransition(() => {
                    navigate(url);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }, [navigate]);
}
```

**`useOpenPage`** — хелпер для onClick-навигации.

**Где взять пример:** `src/hooks/useOpenPage.js`

```jsx
import { useAnimatedNavigate } from "./useAnimatedNavigate";

export const useOpenPage = () => {
    const navigate = useAnimatedNavigate();
    return (url) => () => navigate(url);
}
```

**`usePopup`** — управление модальным окном.

**Где взять пример:** `src/components/popup/popup.jsx` (строки 24–48)

```jsx
export const usePopup = () => {
    const [active, setActive] = useState(false);
    const activeRef = useRef(active);
    activeRef.current = active;

    const show = useCallback(() => setActive(true), []);
    const hide = useCallback(() => setActive(false), []);

    const renderPopup = useCallback(({ children, ...props }) => {
        return <Popup active={activeRef.current} setActive={setActive} {...props}>
            {children}
        </Popup>;
    }, []);

    return [renderPopup, show, hide, active];
};
```

**`useConfirmPopup`** — подтверждение действия.

**Где взять пример:** `src/components/popup/confirmPopup/confirmPopup.jsx`

```jsx
export const useConfirmPopup = (title, subtitle, onApprove = () => {}, onCancel = () => {}) => {
    const [Popup, open, close] = usePopup();

    const popupObject = useMemo(() => {
        return (
            <Popup>
                <Text as="div" variant="title" align="center">{title}</Text>
                <Text as="div" variant="body" align="center">{subtitle}</Text>
                <Button text="Отменить" type="hint" onClick={() => { onCancel(); close(); }} />
                <Button text="Подтвердить" type="destructive" onClick={() => { onApprove(); close(); }} />
            </Popup>
        );
    }, [title, subtitle, onCancel, onApprove, close]);

    return [popupObject, open, close];
}
```

---

## Категория I: Порядок импортов

### I.1 Выявленный паттерн (анализ 10+ файлов)

Группировка **не формализована**, но прослеживается устойчивый порядок:

```
1. React и react-router хуки
2. Redux хуки (useSelector, useDispatch)
3. Переиспользуемые компоненты (из components/)
4. Частные компоненты (из текущей папки)
5. API-модули
6. Утилиты и хелперы
7. Иконки (из assets/icons)
8. Библиотеки (classnames, qs, ...)
9. CSS Module (ВСЕГДА последний)
```

**Где взять пример:** `src/pages/user/tablePage/tablePage.jsx`

```jsx
import { Text } from "../../../components/text/text";          // 3. Компоненты
import { useEffect, useState } from "react"                     // 1. React
import { CalendarIcon, ClockIcon } from "../../../assets/icons"  // 7. Иконки
import { Calendar } from "../../../components/calendar/calendar" // 3. Компоненты
import { useSelector } from "react-redux"                       // 2. Redux
import { usePopup } from "../../../components/popup/popup"       // 3. Компоненты
import { WeekDayPopup } from "./weekDayPopup"                   // 4. Частные
import TableAPI from "../../../api/TableAPI"                     // 5. API
import classNames from "classnames"                              // 8. Библиотеки

import styles from "./tablePage.module.css"                      // 9. CSS (последний)
```

**Ключевое правило:** Импорт CSS Module **всегда** отделён пустой строкой и идёт **последним**.

### I.2 Алиасы путей

Алиасы (`@/`, `~/`) **не используются**. Все пути — относительные (`../../../components/...`).

---

## Категория J: Запрещённые и нерекомендуемые практики

### J.1 Запрещено (не встречается в проекте — поддерживать паттерн)

| Практика | Статус | Основание |
|----------|--------|-----------|
| Инлайн-стили | **Избегать** | Единственное исключение — динамические значения (`style={{ width }}`) в `header.jsx`, `mainPage.jsx`. Для статических стилей **всегда** CSS Modules |
| `export default` для компонентов | **Не используется** | Все компоненты — `export const`. Default export только для API-классов и Redux-редьюсеров |
| TypeScript (`.ts`, `.tsx`) | **Не используется** | Проект полностью на JavaScript |
| SCSS (`.scss`, `.module.scss`) | **Не используется** | Только `.css` и `.module.css` |
| `React.lazy` / `Suspense` | **Не используется** | Все импорты — синхронные |
| `AbortController` / `CancelToken` | **Не используется** | Запросы не отменяются |
| `useNavigate` напрямую | **Не используется** | Вместо него — `useAnimatedNavigate` |
| `location.state` | **Не используется** | Данные передаются через URL params / query |
| Тесты | **Отсутствуют** | Библиотеки установлены, но файлов тестов нет |

### J.2 Осторожно (анти-паттерны, присутствующие в коде)

| Практика | Где встречается | Рекомендация |
|----------|----------------|--------------|
| API вызовы напрямую в `useEffect` без AbortController | Повсеместно | При размонтировании компонента ответ может обновить unmounted state |
| `.catch(console.error)` без UI-обратной связи | Повсеместно | Пользователь не видит ошибки загрузки |
| Прямой доступ к `store.getState()` из `reduxUser.js` | `src/utils/reduxUser.js` | Использовать только вне React-компонентов (в interceptors) |
| Дублирование страниц между `admin/` и `superadmin/` | ~20 почти идентичных папок | Рассмотреть выделение общих компонентов |
| Typo в именах файлов | `uplodeFile.jsx`, `uplodeFiles.jsx` | Переименовать при рефакторинге |

### J.3 Обязательные соглашения (выведены из кода)

1. **Компоненты** — `export const`, **не** `export default`.
2. **API-классы** — `export default` (синглтон).
3. **Redux reducers** — `export default` (для `configureStore`).
4. **CSS Module** — импортируется последним, после пустой строки.
5. **Навигация** — только через `useAnimatedNavigate()`, не `useNavigate()`.
6. **Все тексты** — через компонент `<Text>`, не через raw `<p>`, `<span>`, `<h1>`.
7. **CSS-классы** — `snake_case` (доминирующий стиль).
8. **CSS-переменные** — `--app-<назначение>`, определены в `colorScheme.css`.
9. **API маппинг** — `snake_case` (бэкенд) → `camelCase` (фронтенд) в каждом API-методе.
10. **Папка страницы** = папка в `pages/<роль>/` + `.jsx` + `.module.css` + частные компоненты рядом.

---
---

# ПРАВИЛА ДЛЯ СОЗДАНИЯ ПРОЕКТА С НУЛЯ (Bootstrap)

> Категории K–T описывают, как поднять аналогичный проект с нуля,
> воспроизводя архитектуру и паттерны текущей кодовой базы.

---

## Категория K: Инициализация проекта

### K.1 Создание и зависимости

Проект создаётся через Create React App. Базовые зависимости:

```bash
npx create-react-app frontend
cd frontend

npm install @reduxjs/toolkit react-redux
npm install react-router
npm install axios
npm install classnames
```

Дополнительные (по необходимости проекта):

```bash
npm install qs                     # парсинг query-строки
npm install dompurify              # безопасный HTML-рендеринг
npm install draft-js draft-js-export-html draft-js-import-html  # rich-text
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers  # drag-and-drop
npm install react-swipeable        # свайпы
npm install file-saver             # скачивание файлов
```

### K.2 Структура папок (создать сразу)

После `create-react-app` удалить лишние файлы из `src/` и создать каркас:

```
src/
├── index.js
├── api/
│   └── APIClient.js
├── assets/
│   └── icons.jsx
├── components/
├── config/
│   ├── constants.js
│   └── routerConfig.js
├── features/
├── hooks/
│   ├── useAnimatedNavigate.js
│   └── useOpenPage.js
├── pages/
│   ├── app/
│   │   ├── app.jsx
│   │   ├── zeroStyle.css
│   │   ├── colorScheme.css
│   │   └── pageStyle.css
│   └── auth/
│       ├── _styles/
│       │   └── authPage.module.css
│       └── login/
│           └── loginPage.jsx
├── store/
│   └── store.js
├── templates/
└── utils/
    └── authStorage.js
```

### K.3 Переменные окружения

Файл `.env` в корне `frontend/`:

```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

Доступ в коде: `process.env.REACT_APP_API_URL`. CRA требует префикс `REACT_APP_`.

---

## Категория L: Точка входа и провайдеры

### L.1 Файл index.js

Точка входа минимальна — только создание root, провайдеры и роутер.

**Где взять пример:** `src/index.js`

```jsx
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import { createBrowserRouter, RouterProvider } from "react-router";
import { routerConfig } from "./config/routerConfig.js";

const root = ReactDOM.createRoot(document.getElementById('root'));
const router = createBrowserRouter(routerConfig);

root.render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
);
```

**Порядок провайдеров:**
1. `<Provider store={store}>` (Redux) — внешний
2. `<RouterProvider router={router} />` (react-router) — внутренний

### L.2 Не добавлять в index.js

- Логику авторизации (она в `App`)
- Глобальные стили (они импортируются в `app.jsx`)
- `React.StrictMode` (в проекте не используется)

---

## Категория M: Глобальные стили (создание с нуля)

### M.1 Файл CSS reset — `zeroStyle.css`

Сбрасывает браузерные стили, задаёт шрифт. Импортируется в `app.jsx`.

**Где взять пример:** `src/pages/app/zeroStyle.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

html {
    overflow: hidden;
    max-height: 100vh;
    height: 100%;
    width: 100%;
    display: grid;
}

body, #root {
    max-height: 100%;
    height: 100%;
    display: grid;
    background-color: var(--app-bg-color);
    overflow: hidden;
}

* {
    padding: 0;
    margin: 0;
    border: none;
    color: var(--app-text-color);
    font-family: "Inter", sans-serif;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    user-select: none;
}

*, *::before, *::after {
    box-sizing: border-box;
}

a, a:link, a:visited { text-decoration: none; }
img, svg { max-width: 100%; height: auto; }
button, input[type="submit"] { cursor: pointer; background: none; }
input:focus, button:focus { outline: none; }
```

### M.2 Цветовая схема — `colorScheme.css`

Все цвета — через CSS-переменные в `:root`. Именование: `--app-<назначение>`.

**Минимальный набор переменных для старта:**

```css
:root {
    /* Фоны */
    --app-bg-color: #FFF;
    --app-secondary-bg-color: #DBDBDB;
    --app-hint-color: rgba(0, 0, 0, .05);
    --app-hint-solid-color: #F2F2F2;

    /* Текст */
    --app-text-color: #000;
    --app-secondary-text-color: #666;
    --app-placeholder-color: #AAA;
    --app-button-text-color: #FFF;

    /* Акценты */
    --app-accent-color: #F68D2B;
    --app-active-accent-color: #df842f;
    --app-info-color: #3B76FF;
    --app-destructive-color: #E54646;
    --app-correct-color: #22C55E;

    /* Границы */
    --app-border-color: #C0C0C0;

    /* Производные */
    --app-button-color: var(--app-accent-color);
    --app-secondary-button-color: var(--app-hint-solid-color);
    --app-info-button-color: var(--app-info-color);
    --app-destructive-button-color: var(--app-destructive-color);
    --app-done-color: var(--app-correct-color);
}
```

### M.3 Layout-классы — `pageStyle.css`

Глобальные классы для layout страниц. Используются без CSS Module (глобально).

**Где взять пример:** `src/pages/app/pageStyle.css`

```css
.page_container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    align-items: center;
    justify-content: center;
}

.page_content {
    flex: 1 1 auto;
    padding: 0 16px;
    padding-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-x: hidden;
    overflow-y: auto;
    max-width: 425px;
    width: 100%;
}

.page_header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

*::-webkit-scrollbar { display: none; }

@view-transition { navigation: auto; }
::view-transition-old(root) { animation: fade-out 0.3s ease-in-out; }
::view-transition-new(root) { animation: fade-in 0.3s ease-in-out; }

@keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

.link { color: var(--app-accent-color); cursor: pointer; }

@media screen and (min-width: 768px) {
    .page_container {
        flex-direction: row-reverse;
        align-items: start;
    }
    .page_content {
        overflow-y: auto;
        max-height: 100vh;
        padding: 20px;
    }
}
```

### M.4 Импорт глобальных стилей

Все три файла импортируются **только в `app.jsx`**, без CSS Module синтаксиса:

```jsx
import "./zeroStyle.css";
import "./pageStyle.css";
import "./colorScheme.css";
```

---

## Категория N: APIClient (создание с нуля)

### N.1 Полный шаблон APIClient

Центральный HTTP-клиент. Создаётся один раз — всё остальное API использует его.

**Где взять пример:** `src/api/APIClient.js`

```jsx
import axios from "axios";
import { clearAuthSession, getAccessToken, getRefreshToken, setAuthSession } from "../utils/authStorage";

const LOGIN_PATH = "/auth/login";

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.isRefreshing = false;
        this.pendingRequests = [];

        this.client = axios.create({ baseURL });

        // Request: подставляем Bearer токен
        this.client.interceptors.request.use((config) => {
            const accessToken = getAccessToken();
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        });

        // Response: обработка истёкшего токена
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                const responseCode = error?.response?.data?.code;
                const originalRequest = error?.config;

                if (!originalRequest) return Promise.reject(error);

                // Невалидный токен → на логин
                if (responseCode === "TOKEN_MISSING" || responseCode === "TOKEN_INVALID") {
                    clearAuthSession();
                    window.location.replace(LOGIN_PATH);
                    return Promise.reject(error);
                }

                // Не TOKEN_EXPIRED или уже retry → пробрасываем
                if (responseCode !== "TOKEN_EXPIRED" || originalRequest.__retry) {
                    return Promise.reject(error);
                }

                originalRequest.__retry = true;

                // Если уже обновляем — ставим в очередь
                if (this.isRefreshing) {
                    return new Promise((resolve, reject) => {
                        this.pendingRequests.push({ resolve, reject });
                    }).then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return this.client(originalRequest);
                    });
                }

                this.isRefreshing = true;
                const refreshToken = getRefreshToken();

                if (!refreshToken) {
                    clearAuthSession();
                    window.location.replace(LOGIN_PATH);
                    this.pendingRequests = [];
                    this.isRefreshing = false;
                    return Promise.reject(error);
                }

                try {
                    const refreshUrl = this.baseURL
                        ? `${String(this.baseURL).replace(/\/$/, "")}/auth/refresh`
                        : "/auth/refresh";

                    const res = await axios.post(refreshUrl, { refresh_token: refreshToken });

                    setAuthSession({
                        accessToken: res.data.access_token,
                        refreshToken: res.data.refresh_token,
                    });

                    const newToken = res.data.access_token;
                    this.pendingRequests.forEach(({ resolve }) => resolve(newToken));
                    this.pendingRequests = [];

                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return this.client(originalRequest);
                } catch (refreshError) {
                    clearAuthSession();
                    this.pendingRequests.forEach(({ reject }) => reject(refreshError));
                    this.pendingRequests = [];
                    window.location.replace(LOGIN_PATH);
                    return Promise.reject(refreshError);
                } finally {
                    this.isRefreshing = false;
                }
            }
        );
    }

    async get(path, config = {}) { return await this.client.get(path, config); }
    async post(path, data = {}, config = {}) { return await this.client.post(path, data, config); }
    async patch(path, data = {}, config = {}) { return await this.client.patch(path, data, config); }
    async put(path, data = {}, config = {}) { return await this.client.put(path, data, config); }
    async delete(path, config = {}) { return await this.client.delete(path, config); }
}

const filterData = (data) => {
    return Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== null)
    );
}

const API = new APIClient(process.env.REACT_APP_API_URL);

export default APIClient;
export { API, filterData };
```

### N.2 Шаблон доменного API-класса

При создании нового домена — скопировать эту структуру:

```jsx
import { API } from "./APIClient";

class ExampleAPIClass {
    async fetchItems() {
        const response = await API.get("/example/items");
        return response.data.items.map(item => ({
            id: item.id,
            title: item.title_text,        // snake_case → camelCase
            createdAt: item.created_at,
        }));
    }

    async createItem(title) {
        const response = await API.post("/example/items", {
            title_text: title,             // camelCase → snake_case
        });
        return response.data;
    }

    async updateItem(id, data) {
        const response = await API.patch(`/example/items/${id}`, {
            title_text: data.title,
        });
        return response.data;
    }

    async deleteItem(id) {
        const response = await API.delete(`/example/items/${id}`);
        return response.data;
    }
}

const ExampleAPI = new ExampleAPIClass();
export default ExampleAPI;
```

---

## Категория O: Авторизация и хранение токенов

### O.1 Утилита authStorage

Безопасная обёртка над `localStorage` для хранения JWT-токенов.

**Где взять пример:** `src/utils/authStorage.js`

```jsx
const ACCESS_TOKEN_KEY = "app_access_token";
const REFRESH_TOKEN_KEY = "app_refresh_token";

const safeGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const safeSet = (key, value) => {
    try {
        if (value === null || value === undefined) localStorage.removeItem(key);
        else localStorage.setItem(key, String(value));
    } catch {}
};

export const getAccessToken = () => safeGet(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => safeGet(REFRESH_TOKEN_KEY);

export const setAuthSession = ({ accessToken, refreshToken }) => {
    safeSet(ACCESS_TOKEN_KEY, accessToken || null);
    safeSet(REFRESH_TOKEN_KEY, refreshToken || null);
};

export const clearAuthSession = () => {
    safeSet(ACCESS_TOKEN_KEY, null);
    safeSet(REFRESH_TOKEN_KEY, null);
};
```

### O.2 AuthAPI — паттерн аутентификации

**Где взять пример:** `src/api/AuthAPI.js`

```jsx
import { API } from "./APIClient";
import { setAuthSession } from "../utils/authStorage";

class AuthAPIClass {
    _saveSession(data) {
        if (!data?.access_token || !data?.refresh_token) return;
        setAuthSession({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
        });
    }

    async login(email, password) {
        const response = await API.post("/auth/login", { email, password });
        this._saveSession(response.data);
        return { /* mapped fields */ };
    }

    async register(name, email, password) {
        const response = await API.post("/auth/register", { name, email, password });
        this._saveSession(response.data);
        return { /* mapped fields */ };
    }
}

const AuthAPI = new AuthAPIClass();
export default AuthAPI;
```

### O.3 Auth guard в корневом App

Корневой компонент `App` проверяет токен и загружает пользователя при маунте.

**Ключевой паттерн** (из `src/pages/app/app.jsx`):

```jsx
export const App = () => {
    const navigate = useAnimatedNavigate();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const isAuthRoute = location.pathname.startsWith("/auth");

    useEffect(() => {
        let isMounted = true;

        const accessToken = getAccessToken();
        if (!accessToken) {
            clearAuthSession();
            if (!isAuthRoute) navigate("/auth/login");
            setLoading(false);
            return () => { isMounted = false; };
        }

        const bootstrap = async () => {
            try {
                const status = await UserAPI.fetchUserStatus();
                if (!isMounted) return;
                dispatch(setStatus(status));
                // ... логика редиректов по ролям
            } catch {
                if (!isMounted) return;
                clearAuthSession();
                if (!isAuthRoute) navigate("/auth/login");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        bootstrap();
        return () => { isMounted = false; };
    }, [dispatch, isAuthRoute, navigate]);

    if (loading && !isAuthRoute) return <PageLoader />;
    return <Outlet />;
};
```

---

## Категория P: Layout-шаблоны (создание с нуля)

### P.1 Шаблон без навигации (для auth-страниц)

**Где взять пример:** `src/templates/auth.jsx`

```jsx
import { Outlet } from "react-router";

export const AuthTemplate = () => {
    return (
        <div className="page_container">
            <div className="page_content">
                <Outlet />
            </div>
        </div>
    );
}
```

### P.2 Шаблон с навигационным меню

**Где взять пример:** `src/templates/user.jsx`

```jsx
import { Outlet } from "react-router";
import { Menu } from "../components/menu/menu.jsx";
import { MenuItem } from "../components/menu/menuItem.jsx";
import { MainPageIcon, ProfileIcon } from "../assets/icons.jsx";

export const UserTemplate = () => {
    const menuItems = [
        <MenuItem key="main" path="/" icon={<MainPageIcon />} text="Главная" />,
        <MenuItem key="profile" path="/profile" icon={<ProfileIcon />} text="Профиль" />,
    ];

    return (
        <div className="page_container">
            <div className="page_content">
                <Outlet />
            </div>
            <Menu>{menuItems}</Menu>
        </div>
    );
}
```

### P.3 Подключение шаблона в роутер

```jsx
export const routerConfig = [
    {
        path: "/",
        element: <App />,
        errorElement: <ErrorBoundary />,
        children: [
            {
                path: "/",
                element: <UserTemplate />,
                children: [
                    { path: "/", element: <MainPage /> },
                    { path: "profile", element: <ProfilePage /> },
                ]
            },
            {
                path: "/admin",
                element: <AdminTemplate />,
                children: [ /* ... */ ]
            },
            {
                path: "/auth",
                element: <AuthTemplate />,
                children: [
                    { index: true, element: <Navigate to="login" replace /> },
                    { path: "login", element: <LoginPage /> },
                    { path: "register", element: <RegisterPage /> },
                ]
            },
            { path: "*", element: <Navigate to="/" replace /> }
        ]
    }
];
```

---

## Категория Q: Базовые компоненты (минимальный набор для старта)

### Q.1 Компонент Text (типографика)

Универсальный текстовый компонент с системой пресетов. Создать **в первую очередь** — он используется повсеместно.

**Где взять пример:** `src/components/text/text.jsx`

Пресеты (view):

| view | fontSize | fontWeight |
|------|----------|------------|
| `title` | 24px | 700 |
| `subtitle` | 18px | 700 |
| `heading` | 16px | 700 |
| `body` | 14px | 400 |
| `bodyStrong` | 14px | 700 |
| `caption` | 12px | 400 |
| `captionStrong` | 12px | 700 |
| `tiny` | 10px | 400 |
| `display` | 40px | 900 |

Использование:

```jsx
<Text as="h1" variant="title">Заголовок страницы</Text>
<Text as="div" variant="body">Обычный текст</Text>
<Text as="div" variant="caption" className={styles.label}>Подпись</Text>
<Text as="div" variant="body" size={16} weight={600}>Кастомные параметры</Text>
```

### Q.2 Компонент Button

Поддерживает варианты: `primary`, `secondary`, `destructive`, `info`, `hint`, `done`. Принимает `icon`, `text`, `type`, `className`, остальное через `...params` на `<button>`.

### Q.3 Компонент Input

Текстовое поле с `label`, `error`, поддержкой `type="password"` (toggle видимости).

### Q.4 Компонент Loader / PageLoader

- `Loader` — SVG-спиннер с анимацией вращения.
- `PageLoader` — полноэкранный лоадер (`flex: 1 1 auto; align-items: center`).

### Q.5 Компонент Popup + usePopup

Модальное окно: снизу на мобилке, по центру на десктопе. Хук `usePopup` возвращает `[RenderComponent, open, close, isActive]`.

### Q.6 Компонент Spring

Flex-пружина для прижатия элементов к низу экрана. На десктопе скрывается.

```jsx
export const Spring = () => <div className={styles.spring} />;
```

```css
.spring { flex: 1 1 auto; }
@media screen and (min-width: 768px) { .spring { display: none; } }
```

### Q.7 Компонент Menu / MenuItem

Нижняя навигация. `MenuItem` использует `NavLink` из react-router для активного состояния.

### Q.8 Порядок создания компонентов

1. `text/` — нужен везде
2. `button/` — используется на каждой странице
3. `input/` — формы
4. `loader/` — состояния загрузки
5. `popup/` — модальные окна, подтверждения
6. `spring/` + `separator/` — layout-утилиты
7. `menu/` — навигация
8. `header/` / `adminHeader/` — шапки страниц
9. Остальные — по мере необходимости

---

## Категория R: Паттерны типичных страниц

### R.1 Страница-список (List Page)

**Где взять пример:** `src/pages/admin/workersList/workersList.jsx`

```jsx
export const ListPage = () => {
    const { entityId } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!entityId) return;
        DomainAPI
            .fetchItems(entityId)
            .then(setItems)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [entityId]);

    if (loading) return <PageLoader />;

    return (
        <>
            <AdminHeader title="Список" />
            {items.map(item => (
                <ItemCard key={item.id} data={item} />
            ))}
        </>
    );
};
```

### R.2 Страница-форма (Create / Edit Page)

**Где взять пример:** `src/pages/admin/adminTaskAddPage/adminTaskAddPage.jsx`

```jsx
export const CreatePage = () => {
    const [title, setTitle] = useState("");
    const [titleError, setTitleError] = useState(false);
    const [loading, setLoading] = useState(false);

    const { parentId } = useParams();
    const navigate = useAnimatedNavigate();

    const resetErrors = () => { setTitleError(false); };

    const validate = () => {
        let hasErrors = false;
        if (title.length === 0) { setTitleError(true); hasErrors = true; }
        return hasErrors;
    };

    const onSave = () => {
        resetErrors();
        if (validate()) return;

        setLoading(true);
        DomainAPI
            .createItem(parentId, title)
            .then(() => navigate(`/admin/${parentId}/items`))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    return (
        <>
            <AdminHeader title="Создание" />
            <Input label="Название" value={title} setValue={setTitle} error={titleError} />
            <Spring />
            <Button text="Сохранить" onClick={onSave} disabled={loading} />
        </>
    );
};
```

### R.3 Детальная страница (Detail Page)

Загружает данные по `id` из URL, показывает информацию и кнопки действий.

```jsx
export const DetailPage = () => {
    const { itemId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DomainAPI
            .fetchItem(itemId)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [itemId]);

    if (loading) return <PageLoader />;

    return (
        <>
            <AdminHeader title={data?.name || ""} />
            <Text as="div" variant="body">{data?.description}</Text>
            <Spring />
            <Button text="Редактировать" onClick={() => navigate(`edit`)} />
        </>
    );
};
```

---

## Категория S: Обработка состояний загрузки и ошибок

### S.1 Состояние загрузки страницы

Паттерн: `useState(true)` → показать `<PageLoader />` → `finally(() => setLoading(false))`.

```jsx
const [pageLoading, setPageLoading] = useState(true);

useEffect(() => {
    SomeAPI
        .fetchData()
        .then(setData)
        .catch(console.error)
        .finally(() => setPageLoading(false));
}, []);

if (pageLoading) return <PageLoader />;
```

### S.2 Состояние загрузки кнопки

Паттерн: `disabled={loading}` + текст кнопки меняется.

```jsx
const [loading, setLoading] = useState(false);

const handleSubmit = () => {
    setLoading(true);
    SomeAPI.create(data)
        .then(() => navigate("/success"))
        .catch(console.error)
        .finally(() => setLoading(false));
};

<Button text={loading ? "Сохраняем..." : "Сохранить"} disabled={loading} onClick={handleSubmit} />
```

### S.3 Ошибки форм

Паттерн: для каждого поля — `useState(false)` для ошибки. При изменении поля — сброс. При submit — валидация.

```jsx
const [email, setEmail] = useState("");
const [emailError, setEmailError] = useState(false);
const [errorText, setErrorText] = useState("");

useEffect(() => setEmailError(false), [email]);
useEffect(() => setErrorText(""), [email]);

const validate = () => {
    let error = false;
    if (!isValidEmail(email)) { setEmailError(true); setErrorText("Некорректный email"); error = true; }
    return error;
};
```

### S.4 Серверные ошибки

Паттерн: `catch` → извлечь `error.response.data.detail` → показать в UI.

```jsx
try {
    await AuthAPI.login(email, password);
} catch (error) {
    setErrorText(error?.response?.data?.detail || "Не удалось выполнить действие");
}
```

### S.5 Error Boundary

Корневой `errorElement` в `routerConfig` для перехвата ошибок рендеринга.

```jsx
{
    path: "/",
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [ /* ... */ ]
}
```

---

## Категория T: Иконки и статические ресурсы

### T.1 SVG-иконки как React-компоненты

Все иконки хранятся в одном файле `src/assets/icons.jsx` как функциональные компоненты.

```jsx
export const MainPageIcon = ({ className, ...props }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="currentColor" />
    </svg>
);

export const ProfileIcon = ({ className, ...props }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
        <path d="..." fill="currentColor" />
    </svg>
);
```

**Соглашения:**
- Именование: `PascalCase` + суффикс `Icon` (`CalendarIcon`, `ClockIcon`, `ArrowIcon`).
- Все принимают `className` и `...props` для гибкости.
- `fill="currentColor"` или `stroke="currentColor"` — чтобы цвет контролировался через CSS.

### T.2 Статические изображения

Изображения лежат в `public/images/` и ссылаются через абсолютный путь:

```jsx
export const DEFAULT_ICON = "/images/defaultIcon.png";
```

---

## Сводная таблица: минимальный набор файлов для запуска

| Файл | Назначение | Категория |
|------|-----------|-----------|
| `src/index.js` | Точка входа, провайдеры | L |
| `src/store/store.js` | Redux store | B.3 |
| `src/config/routerConfig.js` | Все маршруты | A.3, P.3 |
| `src/config/constants.js` | Глобальные константы | K |
| `src/pages/app/app.jsx` | Auth guard, Outlet | O.3 |
| `src/pages/app/zeroStyle.css` | CSS reset | M.1 |
| `src/pages/app/colorScheme.css` | CSS-переменные | M.2 |
| `src/pages/app/pageStyle.css` | Layout-классы | M.3 |
| `src/api/APIClient.js` | Axios-обёртка | N.1 |
| `src/api/AuthAPI.js` | Аутентификация | O.2 |
| `src/utils/authStorage.js` | JWT-токены | O.1 |
| `src/hooks/useAnimatedNavigate.js` | Навигация | C.3 |
| `src/hooks/useOpenPage.js` | onClick навигация | H.3 |
| `src/templates/auth.jsx` | Layout без меню | P.1 |
| `src/templates/<role>.jsx` | Layout с меню | P.2 |
| `src/features/statusReducer.js` | Слайс ролей | B.6 |
| `src/features/userReducer.js` | Barrel user-фичи | B.1 |
| `src/components/text/` | Типографика | Q.1 |
| `src/components/button/` | Кнопка | Q.2 |
| `src/components/input/` | Поле ввода | Q.3 |
| `src/components/loader/` | Спиннер + PageLoader | Q.4 |
| `src/components/popup/` | Модалка + usePopup | Q.5 |
| `src/components/spring/` | Flex-пружина | Q.6 |
| `src/components/menu/` | Навигация | Q.7 |
| `src/assets/icons.jsx` | SVG-иконки | T.1 |
| `src/pages/auth/login/loginPage.jsx` | Первая страница | A.2 |
