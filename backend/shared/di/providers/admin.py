from dishka import Provider, Scope


class AdminUsecaseProvider(Provider):
    scope = Scope.REQUEST
    # use_cases = provide_all(...)
