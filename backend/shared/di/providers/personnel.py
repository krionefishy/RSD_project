from dishka import Provider, Scope, provide

from app.personnel.usecases.create_hourly_earning_events_usecase import CreateHourlyEarningEventsUseCase
from app.personnel.usecases.get_employee_compensation_usecase import GetEmployeeCompensationUseCase
from app.personnel.usecases.get_employee_earnings_usecase import GetEmployeeEarningsUseCase
from app.personnel.usecases.get_employee_timesheet_usecase import GetEmployeeTimesheetUseCase
from app.personnel.usecases.get_location_timesheet_usecase import GetLocationTimesheetUseCase
from app.personnel.usecases.recalculate_earning_totals_usecase import RecalculateEarningTotalsUseCase


class PersonnelUsecaseProvider(Provider):
    scope = Scope.REQUEST

    get_employee_compensation = provide(GetEmployeeCompensationUseCase)
    get_location_timesheet = provide(GetLocationTimesheetUseCase)
    get_employee_timesheet = provide(GetEmployeeTimesheetUseCase)
    get_employee_earnings = provide(GetEmployeeEarningsUseCase)
    create_hourly_earning_events = provide(CreateHourlyEarningEventsUseCase)
    recalculate_earning_totals = provide(RecalculateEarningTotalsUseCase)
