from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.usecases.courses.complete_course_usecase import CompleteCourseUseCase
from app.knowledge_base.usecases.courses.get_course_usecase import GetCourseByIdUseCase
from app.knowledge_base.usecases.courses.list_courses_usecase import ListCoursesUseCase
from app.knowledge_base.usecases.materials.get_material_usecase import GetMaterialByIdUseCase
from app.knowledge_base.usecases.materials.resolve_material_attachments_usecase import (
    ResolveMaterialAttachmentsUseCase,
)
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
from storage.s3.client import S3Client


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

    @provide
    def resolve_material_attachments(
        self,
        session: AsyncSession,
        s3_client: S3Client,
    ) -> ResolveMaterialAttachmentsUseCase:
        return ResolveMaterialAttachmentsUseCase(session, s3_client)
