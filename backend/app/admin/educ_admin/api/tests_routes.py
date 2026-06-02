from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, status

from app.admin.educ_admin.domain import CreateTestRequest, UpdateTestRequest
from app.admin.educ_admin.usecases.test_tasks.assign_task_to_test_usecase import AssignTaskToTestUseCase
from app.admin.educ_admin.usecases.test_tasks.remove_task_from_test_usecase import RemoveTaskFromTestUseCase
from app.admin.educ_admin.usecases.tests.create_test_usecase import CreateTestUseCase
from app.admin.educ_admin.usecases.tests.delete_test_usecase import DeleteTestUseCase
from app.admin.educ_admin.usecases.tests.list_tests_usecase import ListTestsUseCase
from app.admin.educ_admin.usecases.tests.update_test_usecase import UpdateTestUseCase
from app.auth.deps import AuthContext, require_education_admin
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestDTO, TestsListDTO
from app.users.db_models import UserRole

router = APIRouter(route_class=DishkaRoute)


def _ctx(auth: AuthContext) -> UserContext:
    return UserContext(user_id=UUID(auth.user_id), role=UserRole(auth.role))


@router.get("", response_model=TestsListDTO, summary="Список тестов")
async def list_tests(
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[ListTestsUseCase],
) -> TestsListDTO:
    result = await usecase.execute(_ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return result


@router.post("", response_model=TestDTO, summary="Создать тест")
async def create_test(
    request: CreateTestRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[CreateTestUseCase],
) -> TestDTO:
    result = await usecase.execute(request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return result


@router.put("/{test_id}", response_model=TestDTO, summary="Обновить тест")
async def update_test(
    test_id: int,
    request: UpdateTestRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[UpdateTestUseCase],
) -> TestDTO:
    result = await usecase.execute(test_id, request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")
    return result


@router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить тест")
async def delete_test(
    test_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[DeleteTestUseCase],
) -> None:
    result = await usecase.execute(test_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test not found")


@router.post("/{test_id}/tasks", status_code=status.HTTP_204_NO_CONTENT, summary="Привязать задачу к тесту")
async def assign_task_to_test(
    test_id: int,
    task_id: int,
    order: int = 0,
    auth: Annotated[AuthContext, Depends(require_education_admin)] = ...,
    usecase: FromDishka[AssignTaskToTestUseCase] = ...,
) -> None:
    result = await usecase.execute(test_id, task_id, order, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Test or task not found")


@router.delete("/{test_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить задачу из теста")
async def remove_task_from_test(
    test_id: int,
    task_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)] = ...,
    usecase: FromDishka[RemoveTaskFromTestUseCase] = ...,
) -> None:
    result = await usecase.execute(test_id, task_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
