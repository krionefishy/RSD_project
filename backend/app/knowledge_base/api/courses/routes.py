from fastapi import APIRouter, HTTPException, status
from dishka.integrations.fastapi import DishkaRoute, FromDishka

from app.auth.deps import AuthContext
from app.knowledge_base.domain import CompleteCourseRequest, UserContext
from app.knowledge_base.dto import CompleteCourseResultDTO, CourseDTO, CoursesListDTO
from app.knowledge_base.usecases.courses.complete_course_usecase import CompleteCourseUseCase
from app.knowledge_base.usecases.courses.get_course_usecase import GetCourseByIdUseCase
from app.knowledge_base.usecases.courses.list_courses_usecase import ListCoursesUseCase
from app.users.db_models import UserRole

router = APIRouter(route_class=DishkaRoute)


@router.get(
    "/{course_id}",
    response_model=CourseDTO,
    summary="Получить курс по ID",
    description="Возвращает курс с материалами, тестами и прогрессом",
)
async def get_course_by_id(
    course_id: int,
    auth: FromDishka[AuthContext],
    usecase: FromDishka[GetCourseByIdUseCase],
) -> CourseDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    course = await usecase.execute(
        course_id=course_id,
        ctx=ctx,
    )

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id={course_id} not found or access denied",
        )

    return course


@router.get(
    "/",
    response_model=CoursesListDTO,
    summary="Список курсов",
    description="Возвращает список курсов в рамках прав пользователя",
)
async def list_courses(
    auth: FromDishka[AuthContext],
    usecase: FromDishka[ListCoursesUseCase],
) -> CoursesListDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    result = await usecase.execute(ctx=ctx)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to list courses for this role",
        )

    return result


@router.post(
    "/complete",
    response_model=CompleteCourseResultDTO,
    summary="Завершить курс",
    description="Проверяет выполнение всех требований и отмечает курс как завершённый",
)
async def complete_course(
    request: CompleteCourseRequest,
    auth: FromDishka[AuthContext],
    usecase: FromDishka[CompleteCourseUseCase],
) -> CompleteCourseResultDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    result = await usecase.execute(
        request=request,
        ctx=ctx,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied",
        )

    return result
