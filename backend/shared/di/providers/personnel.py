from dishka import Provider, Scope, provide

from app.personnel.usecases.get_employee_compensation_usecase import GetEmployeeCompensationUseCase
from app.personnel.usecases.get_employee_timesheet_usecase import GetEmployeeTimesheetUseCase
from app.personnel.usecases.get_location_timesheet_usecase import GetLocationTimesheetUseCase


class PersonnelUsecaseProvider(Provider):
    scope = Scope.REQUEST

    get_employee_compensation = provide(GetEmployeeCompensationUseCase)
    get_location_timesheet = provide(GetLocationTimesheetUseCase)
    get_employee_timesheet = provide(GetEmployeeTimesheetUseCase)
