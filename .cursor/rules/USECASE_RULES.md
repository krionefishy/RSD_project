# Правила написания Use Cases

## 1. Структура use case

### 1.1. Расположение файла

```
backend/app/<module>/usecases/<entity>/<action>_<entity>_usecase.py
```

Примеры:
- `backend/app/knowledge_base/usecases/courses/get_course_usecase.py`
- `backend/app/knowledge_base/usecases/materials/get_material_usecase.py`
- `backend/app/knowledge_base/usecases/tests/start_test_usecase.py`

Правило выбора модуля по ролям описано отдельно: `.cursor/rules/USECASE_PLACEMENT_RULES.md`.
Коротко: use case располагается в блоке наименьшей по правам роли, которой доступен сценарий. Если сценарий доступен пользователю, его нельзя класть в `admin`, даже если администраторы тоже могут им пользоваться.

### 1.2. Класс use case

```python
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.knowledge_base.access import KB_CONTENT_VIEW_ALL_ROLES
from app.knowledge_base.db_models import CourseModel, CourseUserModel
from app.knowledge_base.dto import CourseDTO
from app.users.db_models import UserRole


class GetCourseByIdUseCase:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def execute(
        self,
        course_id: int,
        user_id: str,
        role: str,
    ) -> Optional[CourseDTO]:
        uid = UUID(user_id)

        if role == UserRole.SELLER.value:
            access = await self.session.execute(
                select(CourseUserModel.id).where(
                    CourseUserModel.user_id == uid,
                    CourseUserModel.course_id == course_id,
                )
            )
            if access.scalar_one_or_none() is None:
                return None
        elif role not in KB_CONTENT_VIEW_ALL_ROLES:
            return None

        course_result = await self.session.execute(
            select(CourseModel)
            .where(CourseModel.id == course_id)
            .options(selectinload(CourseModel.course_materials))
        )
        course = course_result.scalar_one_or_none()
        if course is None:
            return None

        return CourseDTO(...)
```

## 2. Конструктор и зависимости

### 2.1. Сессия БД через __init__

Сессия инжектируется через конструктор, а не передается в execute:

```python
def __init__(self, session: AsyncSession):
    self.session = session
```

Источник сессии: `backend/shared/di/providers/app.py` → `SessionProvider`

```python
class SessionProvider(Provider):
    @provide(scope=Scope.REQUEST)
    async def session(self, db: Database) -> AsyncIterator[AsyncSession]:
        session = db.session()
        try:
            yield session
        finally:
            await session.close()
```

### 2.2. Параметры execute

Обязательные:
- `user_id: str` — UUID пользователя (из JWT токена)
- `role: str` — роль пользователя (из JWT токена)
- Параметры запроса — простые типы (int, str, bool) или domain модели которые приходят в роут 

Запрещено:
- Не передавать `session` в execute (уже в `self.session`)
- Не передавать `request: Request`
- Не передавать `is_admin: bool` и не вводить несуществующие роли вроде `"admin"`

### 2.3. Матрица прав и роль

- Источник прав по модулям и ролям: `docs/ROLE_MODEL.md`.
- Значения роли в JWT совпадают с `UserRole` в `app.users.db_models` (`super_admin`, `root_admin`, `admin_staff`, `admin_education`, `admin_sales`, `manager`, `seller`).
- Для повторяющихся наборов ролей в рамках модуля допускаются константы в `app/<module>/access.py` (пример: `backend/app/knowledge_base/access.py`).

### 2.4. Проверка доступа в запросах

Предпочтительно одним SQL-запросом с JOIN подтвердить и связь сущностей (курс — материал — пользователь), и право доступа. Не плодить цепочку отдельных приватных методов вида `_verify_access` + `_material_in_course` для одного логического шага.

### 2.5. Инлайн-логика в `execute`

Не выносить в приватные методы однократные шаги: загрузка одной сущности, сборка DTO из ORM, простая проверка существования. Линейный сценарий — внутри `execute()`. Приватные методы допустимы только при явном переиспользовании между несколькими публичными методами или при существенной сложности без потери читаемости.

### 2.6. Побочная бизнес-логика

Не добавлять в узкий use case тяжёлые побочные эффекты, не относящиеся к его смыслу (например, автоматическое закрытие курса при каждом событии прогресса), если по продукту это отдельное действие пользователя или отдельный use case.

## 3. Аутентификация (JWT)

### 3.1. Библиотека

```python
from jose import JWTError, ExpiredSignatureError, jwt
```

### 3.2. JWT валидация

Локация: `backend/app/auth/deps.py`

```python
@dataclass
class AuthContext:
    valid: bool
    user_id: Optional[str] = None
    role: Optional[str] = None

async def validate_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = FromDishka[AsyncSession],
    settings: Settings = FromDishka[Settings],
) -> AuthContext:
```

Коды ошибок:
- **403 Forbidden**: Невалидный токен (bad signature, malformed, wrong type)
- **401 Unauthorized**: Токен expired или пользователь не найден в БД

### 3.3. Использование в роутах

```python
async def get_course_by_id(
    course_id: int,
    auth: AuthContext = Depends(require_auth),
    usecase: GetCourseByIdUseCase = FromDishka[GetCourseByIdUseCase],
) -> CourseDTO:
    course = await usecase.execute(
        course_id=course_id,
        user_id=auth.user_id,
        role=auth.role,
    )
```

### 3.4. JWT Claims

```python
payload = {
    "sub": str(user_id),           # UUID пользователя
    "type": "access",              # тип токена
    "iat": now,                    # issued at
    "exp": now + expire,           # expiration
}
```

## 4. Возвращаемые значения

### 4.1. Успех

Возвращать DTO модель:

```python
return CourseDTO(
    id=course.id,
    name=course.name,
    ...
)
```

### 4.2. "Не найдено" или "нет доступа"

Возвращать `None` (не исключение):

```python
# use case
if not has_access:
    return None

if course is None:
    return None
```

### 4.3. Обработка в route

```python
course = await usecase.execute(...)
if course is None:
    raise HTTPException(status_code=404, detail="Course not found or access denied")
return course
```

## 5. Работа с БД

### 5.1. Подгрузка связей (selectinload)

```python
from sqlalchemy.orm import selectinload

query = (
    select(CourseModel)
    .where(CourseModel.id == course_id)
    .options(
        selectinload(CourseModel.course_materials),
        selectinload(CourseModel.course_tests),
    )
)
```

### 5.2. Вычисляемые поля (@property)

В модели БД:

```python
@property
def materials_count(self) -> int:
    return len(self.course_materials) if self.course_materials else 0

@property
def tests_count(self) -> int:
    return len(self.course_tests) if self.course_tests else 0
```

Использование в use case:

```python
return CourseDTO(
    materials_count=course.materials_count,
    tests_count=course.tests_count,
)
```

### 5.3. Запрещено

- Не делать отдельные запросы COUNT
- Не использовать lazy loading без необходимости

## 6. API Routes

### 6.1. Роутер

```python
from fastapi import APIRouter

router = APIRouter()
```

### 6.2. Инъекция зависимостей

```python
async def handler(
    usecase: GetCourseByIdUseCase = FromDishka[GetCourseByIdUseCase],
):
```

Формат: `: Type = FromDishka[Type]` (не Annotated)

### 6.3. Полный пример route

```python
@router.get(
    "/{course_id}",
    response_model=CourseDTO,
    summary="Получить курс по ID",
    description="Возвращает курс с материалами и тестами",
)
async def get_course_by_id(
    course_id: int,
    auth: AuthContext = Depends(require_auth),
    usecase: GetCourseByIdUseCase = FromDishka[GetCourseByIdUseCase],
) -> CourseDTO:
    course = await usecase.execute(
        course_id=course_id,
        user_id=auth.user_id,
        role=auth.role,
    )
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found or access denied")
    return course
```

## 7. DI Registration

### 7.1. Провайдер use case

```python
# backend/shared/di/providers/knowledge_base.py
from dishka import Provider, Scope, provide

from app.knowledge_base.usecases.courses.get_course_usecase import GetCourseByIdUseCase


class KnowledgeBaseUsecaseProvider(Provider):
    scope = Scope.REQUEST

    get_course_by_id = provide(GetCourseByIdUseCase)
```

### 7.2. Scope

- `Scope.REQUEST` — для use cases (создается на каждый HTTP запрос)
- `Scope.APP` — для singleton сервисов

### 7.3. Flow инъекции

1. FastAPI получает запрос
2. Dishka видит, что `GetCourseByIdUseCase` требует `AsyncSession`
3. `SessionProvider.session` создает сессию (`Scope.REQUEST`)
4. Dishka вызывает `GetCourseByIdUseCase(session)`
5. Route получает готовый usecase

## 8. Именование

### 8.1. Use case класс

```
<Действие><Сущность>UseCase
```

Примеры:
- `GetCourseByIdUseCase`
- `ListCoursesUseCase`
- `CompleteMaterialUseCase`
- `SubmitTestAnswerUseCase`

### 8.2. Файл

```
backend/app/<module>/usecases/<entity>/<action>_<entity>_usecase.py
```

Формат: `описание_что_делаем_и_с_какой_сущностью_usecase.py`

Примеры:
- `backend/app/knowledge_base/usecases/courses/get_course_usecase.py`
- `backend/app/knowledge_base/usecases/courses/list_courses_usecase.py`
- `backend/app/knowledge_base/usecases/materials/get_material_usecase.py`
- `backend/app/knowledge_base/usecases/materials/complete_material_usecase.py`
- `backend/app/knowledge_base/usecases/tests/get_test_usecase.py`
- `backend/app/knowledge_base/usecases/tests/start_test_usecase.py`

### 8.3. Метод

Всегда `execute()`

## 9. DTO и Domain

### 9.1. DTO (выходные модели)

```python
# backend/app/knowledge_base/dto.py
from typing import List, Optional

class CourseDTO(BaseModel):
    id: int
    name: str
    description: Optional[str]
    rating_points: int
    mrp: int
    materials_count: int
    tests_count: int
    created_at: datetime
    materials: List[CourseMaterialItemDTO]
    tests: List[CourseTestItemDTO]
    user_points_by_course: Optional[int] = None
    is_course_completed: Optional[bool] = None
```

### 9.2. Domain (входные модели)

```python
# backend/app/knowledge_base/domain.py
class CreateCourseRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    rating_points: int = Field(ge=0, default=0)
    mrp: int = Field(ge=0, default=0)
```

## 10. URL структура

```
/api/v1/
├── /health
├── /kb/                         # Knowledge Base
│   ├── /courses/{id}
│   ├── /materials/
│   └── /tests/
├── /users/
├── /sellings/
└── /admin/
```

### 10.1. Регистрация роутеров

```python
# backend/app/api/router.py
api_router.include_router(
    knowledge_base_router,
    prefix="/kb",
    tags=["knowledge-base"],
)

# backend/app/knowledge_base/api/__init__.py
knowledge_base_router.include_router(
    courses_routes.router,
    prefix="/courses",
    tags=["courses"],
)
```

## 11. Комментарии

Запрещено:
- Комментарии в стиле `# Phase 1:`, `# Check if...`
- Docstrings с описанием логики внутри методов
- Любые комментарии, которые просто пересказывают код

Разрешено:
- Type hints в аннотациях
- Названия методов и переменных должны быть самодокументируемыми

Пример плохого кода:
```python
# Phase 1: Verify access
# Check that user is enrolled
```

Пример хорошего кода: проверка доступа и загрузка данных в одном линейном `execute` без лишних приватных обёрток под один вызов.

## 12. Чек-лист создания use case

- [ ] Создать класс в `usecases/<entity>/<action>_<entity>_usecase.py`
- [ ] Добавить `__init__(self, session: AsyncSession)`
- [ ] Реализовать `execute(self, ..., user_id: str, role: str)`
- [ ] Вернуть `DTO | None`
- [ ] Проверка прав по матрице из `docs/ROLE_MODEL.md` и `UserRole` / константы модуля `access.py`
- [ ] Инлайн-логика в `execute()` без приватных методов для однократных шагов
- [ ] Использовать `selectinload` для связей
- [ ] Использовать `@property` моделей для вычисляемых полей
- [ ] Создать/обновить DTO в `dto.py`
- [ ] Создать route в `api/<entity>/routes.py`
- [ ] Использовать `auth: AuthContext = Depends(require_auth)`
- [ ] Инжектировать `usecase: UseCase = FromDishka[UseCase]`
- [ ] Зарегистрировать в провайдере (`provide(UseCase)`)
- [ ] Обработать `None` → `HTTPException(404)` в route
- [ ] Без комментариев — только самодокументируемый код
