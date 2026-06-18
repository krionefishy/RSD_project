"""Report endpoints: learning, personnel earnings, and XLSX export via report_service."""
from typing import Annotated, Optional
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.auth.deps import AuthContext, require_personnel_viewer, require_software_admin
from app.reports.usecases.exports.get_report_export_usecase import (
    GetReportExportUseCase,
    ReportExportStatusDTO,
)
from app.reports.usecases.exports.request_report_export_usecase import (
    RequestReportExportUseCase,
    ReportExportRequestDTO,
)
from app.reports.usecases.get_learning_report_usecase import GetLearningReportUseCase, LearningReportDTO
from app.reports.usecases.get_personnel_earnings_report_usecase import (
    GetPersonnelEarningsReportUseCase,
    PersonnelEarningsReportDTO,
)
from shared.integrations.report_service.client import ReportServiceError

reports_router = APIRouter(route_class=DishkaRoute)


@reports_router.get(
    "/learning",
    response_model=LearningReportDTO,
    summary="Отчёт по обучению (прогресс всех пользователей)",
)
async def get_learning_report(
    auth: Annotated[AuthContext, Depends(require_personnel_viewer)],
    usecase: FromDishka[GetLearningReportUseCase],
) -> LearningReportDTO:
    return await usecase.execute()


@reports_router.get(
    "/personnel/earnings",
    response_model=PersonnelEarningsReportDTO,
    summary="Отчёт по начислениям персонала",
)
async def get_personnel_earnings_report(
    auth: Annotated[AuthContext, Depends(require_software_admin)],
    usecase: FromDishka[GetPersonnelEarningsReportUseCase],
    year: Optional[int] = Query(default=None),
    month: Optional[int] = Query(default=None),
) -> PersonnelEarningsReportDTO:
    return await usecase.execute(year=year, month=month)


# ---- XLSX export endpoints (via report_service) --------------------------


class RequestExportBody(BaseModel):
    report_type: str
    scope_type: str = "network"
    scope_id: Optional[int] = None
    period_from: Optional[str] = None
    period_to: Optional[str] = None


class RequestExportResponse(BaseModel):
    job_id: UUID


class ExportStatusResponse(BaseModel):
    job_id: UUID
    parse_status: str
    report_type: str
    presigned_url: Optional[str] = None


@reports_router.post(
    "/exports",
    response_model=RequestExportResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Запросить генерацию XLSX-отчёта (возвращает job_id)",
)
async def request_report_export(
    body: RequestExportBody,
    auth: Annotated[AuthContext, Depends(require_software_admin)],
    usecase: FromDishka[RequestReportExportUseCase],
) -> RequestExportResponse:
    try:
        result: ReportExportRequestDTO = await usecase.execute(
            report_type=body.report_type,
            scope_type=body.scope_type,
            scope_id=body.scope_id,
            period_from=body.period_from,
            period_to=body.period_to,
        )
    except ReportServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return RequestExportResponse(job_id=result.job_id)


@reports_router.get(
    "/exports/{job_id}",
    response_model=ExportStatusResponse,
    summary="Получить статус и ссылку на скачивание XLSX-отчёта",
)
async def get_report_export(
    job_id: UUID,
    auth: Annotated[AuthContext, Depends(require_software_admin)],
    usecase: FromDishka[GetReportExportUseCase],
) -> ExportStatusResponse:
    try:
        result: ReportExportStatusDTO = await usecase.execute(job_id)
    except ReportServiceError as exc:
        if exc.status_code == 404:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report job not found") from exc
        raise HTTPException(
            status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return ExportStatusResponse(
        job_id=result.job_id,
        parse_status=result.parse_status,
        report_type=result.report_type,
        presigned_url=result.presigned_url,
    )
