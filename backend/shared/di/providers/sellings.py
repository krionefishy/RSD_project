from dishka import Provider, Scope


class SellingsUsecaseProvider(Provider):
    scope = Scope.REQUEST
    # use_cases = provide_all(...)
