from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.educ_admin.usecases.courses.assign_course_to_user_usecase import AssignCourseToUserUseCase
from app.admin.educ_admin.usecases.courses.assign_material_to_course_usecase import (
    AssignMaterialToCourseUseCase,
)
from app.admin.educ_admin.usecases.courses.assign_test_to_course_usecase import AssignTestToCourseUseCase
from app.admin.educ_admin.usecases.courses.create_course_usecase import CreateCourseUseCase
from app.admin.educ_admin.usecases.courses.delete_course_usecase import DeleteCourseUseCase
from app.admin.educ_admin.usecases.courses.list_course_enrollments_usecase import (
    ListCourseEnrollmentsUseCase,
)
from app.admin.educ_admin.usecases.courses.remove_course_from_user_usecase import (
    RemoveCourseFromUserUseCase,
)
from app.admin.educ_admin.usecases.courses.remove_material_from_course_usecase import (
    RemoveMaterialFromCourseUseCase,
)
from app.admin.educ_admin.usecases.courses.remove_test_from_course_usecase import (
    RemoveTestFromCourseUseCase,
)
from app.admin.educ_admin.usecases.courses.reset_course_progress_usecase import ResetCourseProgressUseCase
from app.admin.educ_admin.usecases.courses.reset_test_progress_usecase import ResetTestProgressUseCase
from app.admin.educ_admin.usecases.courses.update_course_usecase import UpdateCourseUseCase
from app.admin.educ_admin.usecases.materials.create_material_usecase import CreateMaterialUseCase
from app.admin.educ_admin.usecases.materials.delete_material_attachment_usecase import (
    DeleteMaterialAttachmentUseCase,
)
from app.admin.educ_admin.usecases.materials.delete_material_usecase import DeleteMaterialUseCase
from app.admin.educ_admin.usecases.materials.list_materials_usecase import ListMaterialsUseCase
from app.admin.educ_admin.usecases.materials.resolve_material_attachment_links_usecase import (
    ResolveMaterialAttachmentLinksUseCase,
)
from app.admin.educ_admin.usecases.materials.update_material_usecase import UpdateMaterialUseCase
from app.admin.educ_admin.usecases.materials.upload_material_attachment_usecase import (
    UploadMaterialAttachmentUseCase,
)
from app.admin.educ_admin.usecases.test_tasks.assign_task_to_test_usecase import AssignTaskToTestUseCase
from app.admin.educ_admin.usecases.test_tasks.create_test_task_usecase import CreateTestTaskUseCase
from app.admin.educ_admin.usecases.test_tasks.delete_test_task_usecase import DeleteTestTaskUseCase
from app.admin.educ_admin.usecases.test_tasks.remove_task_from_test_usecase import RemoveTaskFromTestUseCase
from app.admin.educ_admin.usecases.test_tasks.update_test_task_usecase import UpdateTestTaskUseCase
from app.admin.educ_admin.usecases.tests.create_test_usecase import CreateTestUseCase
from app.admin.educ_admin.usecases.tests.delete_test_usecase import DeleteTestUseCase
from app.admin.educ_admin.usecases.tests.list_tests_usecase import ListTestsUseCase
from app.admin.educ_admin.usecases.tests.update_test_usecase import UpdateTestUseCase
from shared.kafka_streams.producer import KafkaProducerWrapper
from storage.s3.client import S3Client


class EducAdminUsecaseProvider(Provider):
    scope = Scope.REQUEST

    create_course = provide(CreateCourseUseCase)
    update_course = provide(UpdateCourseUseCase)
    delete_course = provide(DeleteCourseUseCase)
    list_course_enrollments = provide(ListCourseEnrollmentsUseCase)
    assign_course_to_user = provide(AssignCourseToUserUseCase)
    remove_course_from_user = provide(RemoveCourseFromUserUseCase)
    reset_course_progress = provide(ResetCourseProgressUseCase)
    reset_test_progress = provide(ResetTestProgressUseCase)
    assign_material_to_course = provide(AssignMaterialToCourseUseCase)
    remove_material_from_course = provide(RemoveMaterialFromCourseUseCase)
    assign_test_to_course = provide(AssignTestToCourseUseCase)
    remove_test_from_course = provide(RemoveTestFromCourseUseCase)

    list_materials = provide(ListMaterialsUseCase)
    create_material = provide(CreateMaterialUseCase)
    update_material = provide(UpdateMaterialUseCase)
    delete_material = provide(DeleteMaterialUseCase)
    list_tests = provide(ListTestsUseCase)
    create_test = provide(CreateTestUseCase)
    update_test = provide(UpdateTestUseCase)
    delete_test = provide(DeleteTestUseCase)

    create_test_task = provide(CreateTestTaskUseCase)
    update_test_task = provide(UpdateTestTaskUseCase)
    delete_test_task = provide(DeleteTestTaskUseCase)
    assign_task_to_test = provide(AssignTaskToTestUseCase)
    remove_task_from_test = provide(RemoveTaskFromTestUseCase)

    @provide
    def upload_material_attachment(
        self,
        session: AsyncSession,
        kafka_producer: KafkaProducerWrapper,
    ) -> UploadMaterialAttachmentUseCase:
        return UploadMaterialAttachmentUseCase(session, kafka_producer)

    @provide
    def delete_material_attachment(
        self,
        session: AsyncSession,
        kafka_producer: KafkaProducerWrapper,
    ) -> DeleteMaterialAttachmentUseCase:
        return DeleteMaterialAttachmentUseCase(session, kafka_producer)

    @provide
    def resolve_material_attachment_links(
        self,
        session: AsyncSession,
        s3_client: S3Client,
    ) -> ResolveMaterialAttachmentLinksUseCase:
        return ResolveMaterialAttachmentLinksUseCase(session, s3_client)
