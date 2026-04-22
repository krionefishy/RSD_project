from dishka import Provider, Scope, provide

from app.knowledge_base.usecases.courses.complete_course_usecase import CompleteCourseUseCase
from app.knowledge_base.usecases.courses.get_course_usecase import GetCourseByIdUseCase
from app.knowledge_base.usecases.courses.list_courses_usecase import ListCoursesUseCase
from app.knowledge_base.usecases.materials.get_material_usecase import GetMaterialByIdUseCase
from app.knowledge_base.usecases.materials.complete_material_usecase import (
    CompleteMaterialUseCase,
)
from app.knowledge_base.usecases.tests.get_test_usecase import GetTestByIdUseCase
from app.knowledge_base.usecases.tests.start_test_usecase import StartTestUseCase
from app.knowledge_base.usecases.tests.submit_answer_usecase import SubmitAnswerUseCase
from app.knowledge_base.usecases.tests.get_test_result_usecase import GetTestResultUseCase
from app.knowledge_base.usecases.user_courses.list_user_courses_usecase import (
    ListUserCoursesUseCase,
)


class KnowledgeBaseUsecaseProvider(Provider):
    scope = Scope.REQUEST

    complete_course = provide(CompleteCourseUseCase)
    get_course_by_id = provide(GetCourseByIdUseCase)
    list_courses = provide(ListCoursesUseCase)
    get_material_by_id = provide(GetMaterialByIdUseCase)
    complete_material = provide(CompleteMaterialUseCase)
    get_test_by_id = provide(GetTestByIdUseCase)
    start_test = provide(StartTestUseCase)
    submit_answer = provide(SubmitAnswerUseCase)
    get_test_result = provide(GetTestResultUseCase)
    list_user_courses = provide(ListUserCoursesUseCase)
