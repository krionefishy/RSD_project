from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status

from app.admin.educ_admin.domain import CreateMaterialRequest, UpdateMaterialRequest
from app.admin.educ_admin.usecases.materials.create_material_usecase import CreateMaterialUseCase
from app.admin.educ_admin.usecases.materials.delete_material_attachment_usecase import DeleteMaterialAttachmentUseCase
from app.admin.educ_admin.usecases.materials.delete_material_usecase import DeleteMaterialUseCase
from app.admin.educ_admin.usecases.materials.list_materials_usecase import ListMaterialsUseCase
from app.admin.educ_admin.usecases.materials.resolve_material_attachment_links_usecase import (
    ResolveMaterialAttachmentLinksUseCase,
)
from app.admin.educ_admin.usecases.materials.update_material_usecase import UpdateMaterialUseCase
from app.admin.educ_admin.usecases.materials.upload_material_attachment_usecase import UploadMaterialAttachmentUseCase
from app.auth.deps import AuthContext, require_education_admin
from app.knowledge_base.domain import UserContext
from app.knowledge_base.dto import (
    MaterialAttachmentDTO,
    MaterialAttachmentLinksDTO,
    MaterialDTO,
    MaterialsListDTO,
)
from app.users.db_models import UserRole

router = APIRouter(route_class=DishkaRoute)

# File payload is published to Kafka as base64 inside JSON.
# Keep the raw upload limit well below the Kafka producer/broker request size.
MAX_ATTACHMENT_SIZE = 16 * 1024 * 1024
ALLOWED_ATTACHMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
    "text/csv",
}


def _ctx(auth: AuthContext) -> UserContext:
    return UserContext(user_id=UUID(auth.user_id), role=UserRole(auth.role))


@router.get("", response_model=MaterialsListDTO, summary="Список материалов")
async def list_materials(
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[ListMaterialsUseCase],
) -> MaterialsListDTO:
    result = await usecase.execute(_ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return result


@router.post("", response_model=MaterialDTO, summary="Создать материал")
async def create_material(
    request: CreateMaterialRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[CreateMaterialUseCase],
) -> MaterialDTO:
    result = await usecase.execute(request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return result


@router.put("/{material_id}", response_model=MaterialDTO, summary="Обновить материал")
async def update_material(
    material_id: int,
    request: UpdateMaterialRequest,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[UpdateMaterialUseCase],
) -> MaterialDTO:
    result = await usecase.execute(material_id, request, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return result


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить материал")
async def delete_material(
    material_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[DeleteMaterialUseCase],
) -> None:
    result = await usecase.execute(material_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")


@router.post("/{material_id}/attachments", response_model=MaterialAttachmentDTO, summary="Загрузить вложение")
async def upload_material_attachment(
    material_id: int,
    file: UploadFile,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[UploadMaterialAttachmentUseCase],
    material_mode: Annotated[str | None, Form()] = None,
) -> MaterialAttachmentDTO:
    if file.content_type not in ALLOWED_ATTACHMENT_TYPES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid file type")
    payload = await file.read()
    if len(payload) > MAX_ATTACHMENT_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")
    result = await usecase.execute(
        material_id,
        filename=file.filename or "attachment",
        content_type=file.content_type or "application/octet-stream",
        payload=payload,
        material_mode=material_mode,
        ctx=_ctx(auth),
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return result


@router.post(
    "/{material_id}/attachments/resolve",
    response_model=MaterialAttachmentLinksDTO,
    summary="Получить ссылки на вложения материала для админа обучения",
)
async def resolve_material_attachments(
    material_id: int,
    attachment_ids: list[int],
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[ResolveMaterialAttachmentLinksUseCase],
) -> MaterialAttachmentLinksDTO:
    result = await usecase.execute(material_id, attachment_ids, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return result


@router.delete("/{material_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить вложение")
async def delete_material_attachment(
    material_id: int,
    attachment_id: int,
    auth: Annotated[AuthContext, Depends(require_education_admin)],
    usecase: FromDishka[DeleteMaterialAttachmentUseCase],
) -> None:
    result = await usecase.execute(material_id, attachment_id, _ctx(auth))
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
