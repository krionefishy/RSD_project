from typing import Annotated

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, status

from app.auth.service_auth import ServiceAuthContext, require_service_auth
from app.sales.domain import IncomingSalePayload
from app.sales.dto import IncomingSaleDTO
from app.sales.usecases.ingest_sale_usecase import IngestSaleUseCase

router = APIRouter(route_class=DishkaRoute)


@router.post(
    "/ingest",
    response_model=IncomingSaleDTO,
    status_code=status.HTTP_202_ACCEPTED,
)
async def ingest_sale(
    payload: IncomingSalePayload,
    _auth: Annotated[ServiceAuthContext, Depends(require_service_auth)],
    usecase: FromDishka[IngestSaleUseCase],
) -> IncomingSaleDTO:
    return await usecase.execute(payload)
