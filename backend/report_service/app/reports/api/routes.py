from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Form, UploadFile, status

from app.auth.service_auth import ServiceAuth
from app.reports.dto import ParsedReportDTO, ParsedTimesheetScheduleDTO
from app.reports.usecases.parse_report_usecase import ParseReportUseCase
from app.reports.usecases.parse_timesheet_schedule_usecase import (
    ParseTimesheetScheduleUseCase,
)

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
