from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, status

from app.admin.educ_admin.domain import CreateTestTaskRequest, UpdateTestTaskRequest
from app.admin.educ_admin.usecases.test_tasks.create_test_task_usecase import CreateTestTaskUseCase
from app.admin.educ_admin.usecases.test_tasks.delete_test_task_usecase import DeleteTestTaskUseCase
from app.admin.educ_admin.usecases.test_tasks.update_test_task_usecase import UpdateTestTaskUseCase
from app.auth.deps import AuthContext, require_education_admin
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import TestTaskAdminDTO
from app.users.db_models import UserRole

router = APIRouter(route_class=DishkaRoute)


def _ctx(auth: AuthContext) -> UserContext:
    return UserContext(user_id=UUID(auth.user_id), role=UserRole(auth.role))


@router.post("", response_model=TestTaskAdminDTO, summary="Создать задачу теста")
async def create_test_task(
    request: CreateTestTaskRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[CreateTestTaskUseCase],
) -> TestTaskAdminDTO:
    result = await usecase.execute(request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return result


@router.put("/{task_id}", response_model=TestTaskAdminDTO, summary="Обновить задачу теста")
async def update_test_task(
    task_id: int,
    request: UpdateTestTaskRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[UpdateTestTaskUseCase],
) -> TestTaskAdminDTO:
    result = await usecase.execute(task_id, request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return result


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить задачу теста")
async def delete_test_task(
    task_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[DeleteTestTaskUseCase],
) -> None:
    result = await usecase.execute(task_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
