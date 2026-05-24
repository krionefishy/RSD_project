from datetime import date
from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends

from app.auth.deps import AuthContext, require_personnel_viewer
from app.personnel.domain import TimesheetPeriodQuery
from app.personnel.dto import EmployeeCompensationDTO, EmployeeTimesheetDTO, LocationTimesheetDTO
from app.personnel.usecases.get_employee_compensation_usecase import GetEmployeeCompensationUseCase
from app.personnel.usecases.get_employee_timesheet_usecase import GetEmployeeTimesheetUseCase
from app.personnel.usecases.get_location_timesheet_usecase import GetLocationTimesheetUseCase

router = APIRouter(route_class=DishkaRoute)


@router.get(
    "/locations/{location_id}/timesheet",
    response_model=LocationTimesheetDTO,
    summary="Табель-график точки",
)
async def get_location_timesheet(
    location_id: int,
    auth: Annotated[AuthContext, Depends(require_personnel_viewer)],
    usecase: FromDishka[GetLocationTimesheetUseCase],
    period_from: date,
    period_to: date,
) -> LocationTimesheetDTO:
    query = TimesheetPeriodQuery(period_from=period_from, period_to=period_to)
    return await usecase.execute(location_id, query, auth)


@router.get(
    "/users/{user_id}/timesheet",
    response_model=EmployeeTimesheetDTO,
    summary="Табель-график сотрудника",
)
async def get_employee_timesheet(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_personnel_viewer)],
    usecase: FromDishka[GetEmployeeTimesheetUseCase],
    period_from: date,
    period_to: date,
    location_id: int | None = None,
) -> EmployeeTimesheetDTO:
    query = TimesheetPeriodQuery(
        period_from=period_from,
        period_to=period_to,
        location_id=location_id,
    )
    return await usecase.execute(user_id, query, auth)


@router.get(
    "/users/{user_id}/compensation",
    response_model=EmployeeCompensationDTO | None,
    summary="Ставка и оклад сотрудника",
)
async def get_employee_compensation(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_personnel_viewer)],
    usecase: FromDishka[GetEmployeeCompensationUseCase],
) -> EmployeeCompensationDTO | None:
    return await usecase.execute(user_id, auth)
