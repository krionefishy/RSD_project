from dishka import Provider, Scope, provide

from shared.integrations.report_service import ReportServiceClient
from shared.settings.config import Settings


class ReportServiceIntegrationProvider(Provider):
    scope = Scope.APP

    @provide
    def report_service_client(self, settings: Settings) -> ReportServiceClient:
        return ReportServiceClient(
            client_config=settings.report_service_client,
            service_jwt=settings.service_jwt,
        )
