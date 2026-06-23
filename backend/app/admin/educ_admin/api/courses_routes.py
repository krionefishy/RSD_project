from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, status

from app.admin.educ_admin.domain import (
    AssignCourseEnrollmentRequest,
    AssignMaterialToCourseRequest,
    AssignTestToCourseRequest,
    CreateCourseRequest,
    UpdateCourseRequest,
)
from app.admin.educ_admin.usecases.courses.assign_course_to_user_usecase import AssignCourseToUserUseCase
from app.admin.educ_admin.usecases.courses.assign_material_to_course_usecase import AssignMaterialToCourseUseCase
from app.admin.educ_admin.usecases.courses.assign_test_to_course_usecase import AssignTestToCourseUseCase
from app.admin.educ_admin.usecases.courses.create_course_usecase import CreateCourseUseCase
from app.admin.educ_admin.usecases.courses.delete_course_usecase import DeleteCourseUseCase
from app.admin.educ_admin.usecases.courses.list_course_enrollments_usecase import ListCourseEnrollmentsUseCase
from app.admin.educ_admin.usecases.courses.list_course_test_task_bank_usecase import (
    ListCourseTestTaskBankUseCase,
)
from app.admin.educ_admin.usecases.courses.remove_course_from_user_usecase import RemoveCourseFromUserUseCase
from app.admin.educ_admin.usecases.courses.remove_material_from_course_usecase import RemoveMaterialFromCourseUseCase
from app.admin.educ_admin.usecases.courses.remove_test_from_course_usecase import RemoveTestFromCourseUseCase
from app.admin.educ_admin.usecases.courses.reset_course_progress_usecase import ResetCourseProgressUseCase
from app.admin.educ_admin.usecases.courses.reset_test_progress_usecase import ResetTestProgressUseCase
from app.admin.educ_admin.usecases.courses.update_course_usecase import UpdateCourseUseCase
from app.auth.deps import AuthContext, require_education_admin
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import (
    CourseEnrollmentDTO,
    CourseEnrollmentsListDTO,
    CourseListItemDTO,
    CourseMaterialItemDTO,
    CourseTestTaskBankDTO,
    CoursesListDTO,
    CourseTestItemDTO,
)
from app.knowledge_base.usecases.courses.list_courses_usecase import ListCoursesUseCase
from app.users.db_models import UserRole

router = APIRouter(route_class=DishkaRoute)


def _ctx(auth: AuthContext) -> UserContext:
    return UserContext(user_id=UUID(auth.user_id), role=UserRole(auth.role))


@router.get("", response_model=CoursesListDTO, summary="Список всех курсов")
async def list_courses(
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[ListCoursesUseCase],
) -> CoursesListDTO:
    result = await usecase.execute(_ctx(auth))
    return result or CoursesListDTO(items=[])


@router.post("", response_model=CourseListItemDTO, summary="Создать курс")
async def create_course(
    request: CreateCourseRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[CreateCourseUseCase],
) -> CourseListItemDTO:
    result = await usecase.execute(request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return result


@router.put("/{course_id}", response_model=CourseListItemDTO, summary="Обновить курс")
async def update_course(
    course_id: int,
    request: UpdateCourseRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[UpdateCourseUseCase],
) -> CourseListItemDTO:
    result = await usecase.execute(course_id, request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return result


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить курс")
async def delete_course(
    course_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[DeleteCourseUseCase],
) -> None:
    result = await usecase.execute(course_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")


@router.get("/{course_id}/enrollments", response_model=CourseEnrollmentsListDTO, summary="Назначения на курс")
async def list_course_enrollments(
    course_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[ListCourseEnrollmentsUseCase],
) -> CourseEnrollmentsListDTO:
    result = await usecase.execute(course_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return result


@router.get(
    "/{course_id}/test-task-bank",
    response_model=CourseTestTaskBankDTO,
    summary="Банк тестовых задач курса",
)
async def list_course_test_task_bank(
    course_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[ListCourseTestTaskBankUseCase],
) -> CourseTestTaskBankDTO:
    result = await usecase.execute(course_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return result


@router.post("/{course_id}/enrollments", response_model=CourseEnrollmentDTO, summary="Назначить курс сотруднику")
async def assign_course_to_user(
    course_id: int,
    request: AssignCourseEnrollmentRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[AssignCourseToUserUseCase],
) -> CourseEnrollmentDTO:
    result = await usecase.execute(course_id, request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course or user not found")
    return result


@router.delete("/{course_id}/enrollments/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Снять назначение курса")
async def remove_course_from_user(
    course_id: int,
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[RemoveCourseFromUserUseCase],
) -> None:
    result = await usecase.execute(course_id, user_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")


@router.post("/{course_id}/enrollments/{user_id}/reset", status_code=status.HTTP_204_NO_CONTENT, summary="Сбросить прогресс курса")
async def reset_course_progress(
    course_id: int,
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[ResetCourseProgressUseCase],
) -> None:
    result = await usecase.execute(course_id, user_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")


@router.post(
    "/{course_id}/enrollments/{user_id}/reset-test/{test_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Сбросить попытку теста",
)
async def reset_test_progress(
    course_id: int,
    user_id: UUID,
    test_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[ResetTestProgressUseCase],
) -> None:
    result = await usecase.execute(course_id, user_id, test_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment or test not found")


@router.post("/{course_id}/materials", response_model=CourseMaterialItemDTO, summary="Привязать материал к курсу")
async def assign_material_to_course(
    course_id: int,
    request: AssignMaterialToCourseRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[AssignMaterialToCourseUseCase],
) -> CourseMaterialItemDTO:
    result = await usecase.execute(course_id, request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course or material not found")
    return result


@router.delete("/{course_id}/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить материал из курса")
async def remove_material_from_course(
    course_id: int,
    material_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[RemoveMaterialFromCourseUseCase],
) -> None:
    result = await usecase.execute(course_id, material_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")


@router.post("/{course_id}/tests", response_model=CourseTestItemDTO, summary="Привязать тест к курсу")
async def assign_test_to_course(
    course_id: int,
    request: AssignTestToCourseRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[AssignTestToCourseUseCase],
) -> CourseTestItemDTO:
    result = await usecase.execute(course_id, request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course or test not found")
    return result


@router.delete("/{course_id}/tests/{test_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить тест из курса")
async def remove_test_from_course(
    course_id: int,
    test_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[RemoveTestFromCourseUseCase],
) -> None:
    result = await usecase.execute(course_id, test_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
