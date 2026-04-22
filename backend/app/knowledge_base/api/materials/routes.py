from fastapi import APIRouter, HTTPException, status
from dishka.integrations.fastapi import FromDishka

from app.auth.deps import AuthContext
from app.knowledge_base.domain import CompleteMaterialRequest, UserContext
from app.knowledge_base.dto import (
    MaterialDTO,
    CompleteMaterialResultDTO,
)
from app.knowledge_base.usecases.materials.get_material_usecase import GetMaterialByIdUseCase
from app.knowledge_base.usecases.materials.complete_material_usecase import (
    CompleteMaterialUseCase,
)
from app.users.db_models import UserRole

router = APIRouter()


@router.get(
    "/{material_id}",
    response_model=MaterialDTO,
    summary="Получить материал по ID",
    description="Возвращает материал со списком вложений в контексте курса",
)
async def get_material_by_id(
    material_id: int,
    course_id: int,
    auth: AuthContext = FromDishka[AuthContext],
    usecase: GetMaterialByIdUseCase = FromDishka[GetMaterialByIdUseCase],
) -> MaterialDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    material = await usecase.execute(
        material_id=material_id,
        course_id=course_id,
        ctx=ctx,
    )

    if material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material with id={material_id} not found or access denied",
        )

    return material


@router.post(
    "/complete",
    response_model=CompleteMaterialResultDTO,
    summary="Отметить материал как изученный",
    description="Отмечает материал пройденным для текущего пользователя в курсе",
)
async def complete_material(
    request: CompleteMaterialRequest,
    auth: AuthContext = FromDishka[AuthContext],
    usecase: CompleteMaterialUseCase = FromDishka[CompleteMaterialUseCase],
) -> CompleteMaterialResultDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    result = await usecase.execute(
        request=request,
        ctx=ctx,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course or material not found or access denied",
        )

    return result
