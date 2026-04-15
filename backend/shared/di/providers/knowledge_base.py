from dishka import Provider, Scope


class KnowledgeBaseUsecaseProvider(Provider):
    scope = Scope.REQUEST
    # use_cases = provide_all(...)
