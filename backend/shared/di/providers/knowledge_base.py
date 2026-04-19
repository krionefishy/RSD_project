from dishka import Provider, Scope, provide

from app.knowledge_base.usecases.courses.get_by_id import GetCourseByIdUseCase


class KnowledgeBaseUsecaseProvider(Provider):
    scope = Scope.REQUEST

    # UC-04: GetCourseById
    get_course_by_id = provide(GetCourseByIdUseCase)
