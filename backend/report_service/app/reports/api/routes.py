import logging
from uuid import UUID, uuid4

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, UploadFile, status

from app.auth.service_auth import ServiceAuth
from app.reports.db_models import ParseStatus, ReportJobModel
from app.reports.dto import (
    GenerateReportRequest,
    GenerateReportResponse,
    ParsedReportDTO,
    ParsedTimesheetScheduleDTO,
    ReportJobStatusDTO,
    VALID_REPORT_TYPES,
    VALID_SCOPE_TYPES,
)
from app.reports.usecases.generate_learning_xlsx_usecase import GenerateLearningXlsxUseCase
from app.reports.usecases.get_report_job_usecase import GetReportJobUseCase
from app.reports.usecases.parse_report_usecase import ParseReportUseCase
from app.reports.usecases.parse_timesheet_schedule_usecase import (
    ParseTimesheetScheduleUseCase,
)
from shared.kafka_streams.producer import KafkaProducerWrapper
from storage.pg.database import Database
from storage.pg.main_replica import MainReplicaDatabase

logger = logging.getLogger(__name__)

router = APIRouter(route_class=DishkaRoute)


@router.post(
    "/parse",
    response_model=ParsedReportDTO,
    status_code=status.HTTP_202_ACCEPTED,
)
async def parse_report(
    file: UploadFile,
    _: ServiceAuth,
    usecase: FromDishka[ParseReportUseCase],
) -> ParsedReportDTO:
    content = await file.read()
    return await usecase.execute(filename=file.filename or "report", content=content)


@router.post(
    "/timesheet-schedules/parse",
    response_model=ParsedTimesheetScheduleDTO,
    status_code=status.HTTP_202_ACCEPTED,
)
async def parse_timesheet_schedule(
    file: UploadFile,
    _: ServiceAuth,
    usecase: FromDishka[ParseTimesheetScheduleUseCase],
    point_identifier: str = Form(...),
    point_name: str = Form(...),
    period_from: str | None = Form(None),
    period_to: str | None = Form(None),
) -> ParsedTimesheetScheduleDTO:
    content = await file.read()
    return await usecase.execute(
        filename=file.filename or "timesheet_schedule.xlsx",
        content=content,
        point_identifier=point_identifier,
        point_name=point_name,
        period_from=period_from,
        period_to=period_to,
    )


# ---- Learning report generation -----------------------------------------


async def _run_generate_task(
    job_id: UUID,
    report_type: str,
    scope_type: str,
    scope_id: int | None,
    period_from: str | None,
    period_to: str | None,
    db: Database,
    main_replica: MainReplicaDatabase,
    kafka_producer: KafkaProducerWrapper,
) -> None:
    uc = GenerateLearningXlsxUseCase(db, main_replica, kafka_producer)
    await uc.execute(job_id, report_type, scope_type, scope_id, period_from, period_to)


@router.post(
    "/generate",
    response_model=GenerateReportResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate_learning_report(
    request: GenerateReportRequest,
    _: ServiceAuth,
    background_tasks: BackgroundTasks,
    db: FromDishka[Database],
    main_replica: FromDishka[MainReplicaDatabase],
    kafka_producer: FromDishka[KafkaProducerWrapper],
) -> GenerateReportResponse:
    if request.report_type not in VALID_REPORT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown report_type. Valid: {sorted(VALID_REPORT_TYPES)}",
        )
    if request.scope_type not in VALID_SCOPE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown scope_type. Valid: {sorted(VALID_SCOPE_TYPES)}",
        )

    job_id = uuid4()
    job = ReportJobModel(
        id=job_id,
        report_type=request.report_type,
        parse_status=ParseStatus.PENDING.value,
        params={
            "scope_type": request.scope_type,
            "scope_id": request.scope_id,
            "period_from": request.period_from,
            "period_to": request.period_to,
        },
    )
    async with db.transaction() as session:
        session.add(job)

    background_tasks.add_task(
        _run_generate_task,
        job_id=job_id,
        report_type=request.report_type,
        scope_type=request.scope_type,
        scope_id=request.scope_id,
        period_from=request.period_from,
        period_to=request.period_to,
        db=db,
        main_replica=main_replica,
        kafka_producer=kafka_producer,
    )

    return GenerateReportResponse(job_id=job_id)


@router.get(
    "/jobs/{job_id}",
    response_model=ReportJobStatusDTO,
)
async def get_report_job(
    job_id: UUID,
    _: ServiceAuth,
    usecase: FromDishka[GetReportJobUseCase],
) -> ReportJobStatusDTO:
    job = await usecase.execute(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report job not found")
    return ReportJobStatusDTO(
        job_id=job.id,
        parse_status=job.parse_status,
        report_type=job.report_type,
        s3_file_key=job.s3_file_key,
        params=job.params,
        uploaded_at=job.uploaded_at,
        completed_at=job.completed_at,
    )
