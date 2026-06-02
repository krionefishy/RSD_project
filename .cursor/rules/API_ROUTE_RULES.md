# Правила написания API routes

## 1. Проверки доступа

Проверки роли и авторизации должны располагаться там, где применяются: в FastAPI dependency на уровне route.

Правильно:

```python
from typing import Annotated

from fastapi import Depends

from app.auth.deps import AuthContext, require_staff_admin


async def create_employee(
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    ...
):
    ...
```

Неправильно:

```python
async def create_employee(auth: FromDishka[AuthContext], ...):
    if auth.role not in allowed:
        raise HTTPException(status_code=403)
```

Route handler не должен содержать ручные проверки вида `_require_staff_admin(auth)`, `_require_software_admin(auth)` или `if auth.role ...`.

## 2. Где хранить deps

Общие deps располагаются в `app/auth/deps.py`:

- `require_auth`
- `require_staff_admin`
- `require_personnel_viewer`
- `require_software_admin`

Если проверка специфична для одного доменного API и не переиспользуется, она располагается рядом с этим API:

```text
backend/app/<module>/api/deps.py
```

Пример: проверка доступа к специфичному namespace `admin/education`, если она не нужна другим модулям.

## 3. Грубый role-gate и объектный scope

Route dependency отвечает за грубый role-gate:

- пользователь авторизован;
- роль входит в допустимый набор для endpoint;
- endpoint явно показывает, кто имеет право его вызвать.

Use case отвечает за объектный scope:

- пользователь может открыть только себя;
- менеджер может открыть только сотрудников своего блока;
- менеджер может открыть только точки своего блока;
- `root_admin` / `super_admin` могут видеть данные без ограничения по блокам.

То есть проверка "роль вообще может вызвать endpoint" находится в `Depends`, а проверка "этот конкретный объект доступен этому пользователю" остается в use case.

## 4. Структура API-папки

Для каждой логической сущности API собирается через `api/__init__.py`.

```text
backend/app/<module>/api/
├── __init__.py          # собирает router модуля
├── routes.py            # базовые/legacy routes или основной набор
├── profile_routes.py    # routes отдельной логической группы
└── timesheet_routes.py  # routes отдельной логической группы
```

`api/__init__.py`:

```python
from fastapi import APIRouter

from app.<module>.api import routes
from app.<module>.api import profile_routes

module_router = APIRouter()
module_router.include_router(profile_routes.router)
module_router.include_router(routes.router)
```

Верхний роутер приложения импортирует только собранный router из `api/__init__.py`, а не внутренние файлы routes.

## 5. Route handler

Route handler должен:

- принять и провалидировать HTTP-вход через Pydantic/FastAPI;
- получить `AuthContext` через dependency;
- получить use case через `FromDishka`;
- собрать простую query/body модель, если нужно;
- вызвать use case;
- вернуть DTO.

Route handler не должен:

- содержать бизнес-логику;
- содержать ручные role checks;
- открывать сессию БД;
- создавать use case вручную;
- дублировать scope-проверки use case.
