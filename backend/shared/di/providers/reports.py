from dishka import Provider, Scope, provide

from app.reports.usecases.calculate_learning_rating_usecase import CalculateLearningRatingUseCase
from app.reports.usecases.exports.get_report_export_usecase import GetReportExportUseCase
from app.reports.usecases.exports.request_report_export_usecase import RequestReportExportUseCase
from app.reports.usecases.get_learning_rating_usecase import GetLearningRatingUseCase
from app.reports.usecases.get_learning_report_usecase import GetLearningReportUseCase
from app.reports.usecases.get_personnel_earnings_report_usecase import GetPersonnelEarningsReportUseCase


class ReportsUsecaseProvider(Provider):
    scope = Scope.REQUEST

    calculate_learning_rating = provide(CalculateLearningRatingUseCase)
    get_learning_rating = provide(GetLearningRatingUseCase)
    get_learning_report = provide(GetLearningReportUseCase)
    get_personnel_earnings_report = provide(GetPersonnelEarningsReportUseCase)
    request_report_export = provide(RequestReportExportUseCase)
    get_report_export = provide(GetReportExportUseCase)
