from datetime import date
from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, UploadFile

from app.admin.staff_admin.usecases.compensations.upsert_employee_compensation_usecase import (
    UpsertEmployeeCompensationUseCase,
)
from app.admin.staff_admin.usecases.timesheets.create_time_entry_usecase import CreateTimeEntryUseCase
from app.admin.staff_admin.usecases.timesheets.delete_time_entry_usecase import DeleteTimeEntryUseCase
from app.admin.staff_admin.usecases.timesheets.update_time_entry_usecase import UpdateTimeEntryUseCase
from app.admin.staff_admin.usecases.timesheets.upload_timesheet_file_usecase import (
    UploadTimesheetFileUseCase,
)
from app.auth.deps import AuthContext, require_staff_admin
from app.personnel.domain import CreateTimeEntryRequest, UpdateTimeEntryRequest, UpsertEmployeeCompensationRequest
from app.personnel.dto import (
    DeleteResultDTO,
    EmployeeCompensationDTO,
    EmployeeTimeEntryDTO,
    TimesheetUploadResultDTO,
)

router = APIRouter(route_class=DishkaRoute)


@router.put(
    "/users/{user_id}/compensation",
    response_model=EmployeeCompensationDTO,
    summary="Создать или обновить ставку сотрудника",
)
async def upsert_employee_compensation(
    user_id: UUID,
    request: UpsertEmployeeCompensationRequest,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[UpsertEmployeeCompensationUseCase],
) -> EmployeeCompensationDTO:
    return await usecase.execute(user_id, request, auth)


@router.post(
    "/timesheets/upload",
    response_model=TimesheetUploadResultDTO,
    summary="Загрузить график из файла",
)
async def upload_timesheet_file(
    file: UploadFile,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[UploadTimesheetFileUseCase],
    period_from: date,
    period_to: date,
    location_id: int | None = None,
) -> TimesheetUploadResultDTO:
    payload = await file.read()
    return await usecase.execute(
        auth,
        filename=file.filename or "timesheet.xlsx",
        payload=payload,
        period_from=period_from,
        period_to=period_to,
        location_id=location_id,
    )


@router.patch(
    "/timesheets/entries/{time_entry_id}",
    response_model=EmployeeTimeEntryDTO,
    summary="Изменить запись графика",
)
async def update_time_entry(
    time_entry_id: int,
    request: UpdateTimeEntryRequest,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[UpdateTimeEntryUseCase],
) -> EmployeeTimeEntryDTO:
    return await usecase.execute(time_entry_id, request, auth)


@router.post(
    "/timesheets/entries",
    response_model=EmployeeTimeEntryDTO,
    summary="Создать запись графика вручную",
)
async def create_time_entry(
    request: CreateTimeEntryRequest,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[CreateTimeEntryUseCase],
) -> EmployeeTimeEntryDTO:
    return await usecase.execute(request, auth)


@router.delete(
    "/timesheets/entries/{time_entry_id}",
    response_model=DeleteResultDTO,
    summary="Удалить запись графика",
)
async def delete_time_entry(
    time_entry_id: int,
    auth: Annotated[AuthContext, Depends(require_staff_admin)],
    usecase: FromDishka[DeleteTimeEntryUseCase],
) -> DeleteResultDTO:
    return await usecase.execute(time_entry_id, auth)
