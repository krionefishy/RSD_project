from dishka import Provider, Scope, provide

from app.users.usecases.get_user_usecase import GetUserUseCase


class UsersUsecaseProvider(Provider):
    scope = Scope.REQUEST

    get_user = provide(GetUserUseCase)
