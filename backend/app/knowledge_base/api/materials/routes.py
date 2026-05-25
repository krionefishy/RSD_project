from typing import Annotated

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.deps import AuthContext, require_auth
from app.knowledge_base.domain import CompleteMaterialRequest, ResolveMaterialAttachmentsRequest, UserContext
from app.knowledge_base.dto import (
    MaterialDTO,
    CompleteMaterialResultDTO,
    MaterialAttachmentLinksDTO,
)
from app.knowledge_base.usecases.materials.get_material_usecase import GetMaterialByIdUseCase
from app.knowledge_base.usecases.materials.complete_material_usecase import (
    CompleteMaterialUseCase,
)
from app.knowledge_base.usecases.materials.resolve_material_attachments_usecase import (
    ResolveMaterialAttachmentsUseCase,
)
from app.users.db_models import UserRole

router = APIRouter(route_class=DishkaRoute)


@router.get(
    "/{material_id}",
    response_model=MaterialDTO,
    summary="Получить материал по ID",
    description="Возвращает материал со списком вложений в контексте курса",
)
async def get_material_by_id(
    material_id: int,
    course_id: int,
    auth: Annotated[AuthContext, Depends(require_auth)],
    usecase: FromDishka[GetMaterialByIdUseCase],
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
    auth: Annotated[AuthContext, Depends(require_auth)],
    usecase: FromDishka[CompleteMaterialUseCase],
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


@router.post(
    "/{material_id}/attachments/resolve",
    response_model=MaterialAttachmentLinksDTO,
    summary="Получить ссылки на вложения материала",
    description="Возвращает pre-signed ссылки для вложений материала, доступных пользователю",
)
async def resolve_material_attachments(
    material_id: int,
    request: ResolveMaterialAttachmentsRequest,
    auth: Annotated[AuthContext, Depends(require_auth)],
    usecase: FromDishka[ResolveMaterialAttachmentsUseCase],
) -> MaterialAttachmentLinksDTO:
    ctx = UserContext(user_id=auth.user_id, role=UserRole(auth.role))
    result = await usecase.execute(material_id=material_id, request=request, ctx=ctx)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found or access denied",
        )

    return result
