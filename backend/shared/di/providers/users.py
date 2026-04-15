from dishka import Provider, Scope


class UsersUsecaseProvider(Provider):
    scope = Scope.REQUEST
    # use_cases = provide_all(...)
