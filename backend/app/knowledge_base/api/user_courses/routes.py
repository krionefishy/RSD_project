from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from dishka.integrations.fastapi import DishkaRoute, FromDishka

from app.auth.deps import AuthContext
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import UserCoursesListDTO
from app.knowledge_base.usecases.user_courses.list_user_courses_usecase import (
    ListUserCoursesUseCase,
)
from app.users.db_models import UserRole

router = APIRouter(route_class=DishkaRoute)


@router.get(
    "/",
    response_model=UserCoursesListDTO,
    summary="Список курсов пользователя",
    description="Возвращает курсы пользователя с прогрессом",
)
async def list_user_courses(
    auth: FromDishka[AuthContext],
    usecase: FromDishka[ListUserCoursesUseCase],
    user_id: UUID | None = None,
) -> UserCoursesListDTO:
    target_user_id = user_id if user_id is not None else auth.user_id
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))

    result = await usecase.execute(
        target_user_id=target_user_id,
        ctx=ctx,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to view this user's courses",
        )

    return result
