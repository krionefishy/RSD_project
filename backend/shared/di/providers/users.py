from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.software_admin.usecases.assign_manager_block_usecase import AssignManagerBlockUseCase
from app.admin.software_admin.usecases.assign_user_block_usecase import AssignUserBlockUseCase
from app.admin.software_admin.usecases.block_user_usecase import BlockUserUseCase
from app.admin.software_admin.usecases.change_user_role_usecase import ChangeUserRoleUseCase
from app.admin.software_admin.usecases.create_user_usecase import CreateUserUseCase
from app.admin.software_admin.usecases.remove_user_block_usecase import RemoveUserBlockUseCase
from app.admin.software_admin.usecases.unblock_user_usecase import UnblockUserUseCase
from app.admin.staff_admin.usecases.profiles.delete_employee_profile_usecase import DeleteEmployeeProfileUseCase
from app.admin.staff_admin.usecases.get_personnel_overview_usecase import GetPersonnelOverviewUseCase
from app.admin.staff_admin.usecases.assign_user_location_usecase import AssignUserLocationUseCase
from app.admin.staff_admin.usecases.remove_user_location_usecase import RemoveUserLocationUseCase
from app.admin.staff_admin.usecases.reset_password_usecase import ResetPasswordUseCase
from app.admin.staff_admin.usecases.update_user_admin_usecase import UpdateUserAdminUseCase
from app.admin.staff_admin.usecases.upload_avatar_usecase import UploadAvatarUseCase
from app.users.usecases.get_user_usecase import GetUserUseCase
from app.users.usecases.list_users_usecase import ListUsersUseCase
from shared.kafka_streams.producer import KafkaProducerWrapper
from storage.s3.client import S3Client


class UsersUsecaseProvider(Provider):
    scope = Scope.REQUEST

    get_user = provide(GetUserUseCase)
    list_users = provide(ListUsersUseCase)
    get_personnel_overview = provide(GetPersonnelOverviewUseCase)
    create_user = provide(CreateUserUseCase)
    update_user_admin = provide(UpdateUserAdminUseCase)
    block_user = provide(BlockUserUseCase)
    unblock_user = provide(UnblockUserUseCase)
    change_user_role = provide(ChangeUserRoleUseCase)
    delete_user = provide(DeleteEmployeeProfileUseCase)
    reset_password = provide(ResetPasswordUseCase)
    assign_manager_block = provide(AssignManagerBlockUseCase)
    assign_user_block = provide(AssignUserBlockUseCase)
    assign_user_location = provide(AssignUserLocationUseCase)
    remove_user_block = provide(RemoveUserBlockUseCase)
    remove_user_location = provide(RemoveUserLocationUseCase)

    @provide
    def upload_avatar(
        self,
        session: AsyncSession,
        kafka_producer: KafkaProducerWrapper,
        s3_client: S3Client,
    ) -> UploadAvatarUseCase:
        return UploadAvatarUseCase(session, kafka_producer, s3_client)
