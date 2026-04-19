from fastapi import APIRouter, Depends, HTTPException, status
from dishka.integrations.fastapi import FromDishka

from app.auth.deps import AuthContext, require_auth
from app.knowledge_base.dto import CourseDTO
from app.knowledge_base.usecases.courses.get_by_id import GetCourseByIdUseCase

router = APIRouter()


@router.get(
    "/{course_id}",
    response_model=CourseDTO,
    summary="Получить курс по ID",
    description="UC-04: Возвращает курс с подсчетом материалов и тестов",
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id={course_id} not found or access denied",
        )

    return course


@router.get("/", response_model=list[CourseDTO])
async def list_courses(
    limit: int = 20,
    offset: int = 0,
    search: str | None = None,
) -> list[CourseDTO]:
    """
    UC-05: Список курсов с пагинацией.

    - **limit**: Количество результатов (1-100, default: 20)
    - **offset**: Смещение (default: 0)
    - **search**: Поиск по названию (optional)

    Returns:
        Список CourseDTO
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="UC-05 ListCourses not implemented yet",
    )
