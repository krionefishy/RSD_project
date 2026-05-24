from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.usecases.compensations.upsert_employee_compensation_usecase import (
    UpsertEmployeeCompensationUseCase,
)
from app.admin.staff_admin.usecases.profiles.block_employee_profile_usecase import (
    BlockEmployeeProfileUseCase,
)
from app.admin.staff_admin.usecases.profiles.change_block_member_status_usecase import (
    ChangeBlockMemberStatusUseCase,
)
from app.admin.staff_admin.usecases.profiles.change_seller_role_usecase import ChangeSellerRoleUseCase
from app.admin.staff_admin.usecases.profiles.create_employee_profile_usecase import (
    CreateEmployeeProfileUseCase,
)
from app.admin.staff_admin.usecases.profiles.delete_employee_profile_usecase import (
    DeleteEmployeeProfileUseCase,
)
from app.admin.staff_admin.usecases.profiles.unblock_employee_profile_usecase import (
    UnblockEmployeeProfileUseCase,
)
from app.admin.staff_admin.usecases.profiles.update_employee_profile_usecase import (
    UpdateEmployeeProfileUseCase,
)
from app.admin.staff_admin.usecases.timesheets.delete_time_entry_usecase import DeleteTimeEntryUseCase
from app.admin.staff_admin.usecases.timesheets.update_time_entry_usecase import UpdateTimeEntryUseCase
from app.admin.staff_admin.usecases.timesheets.upload_timesheet_file_usecase import (
    UploadTimesheetFileUseCase,
)
from app.users.usecases.profiles.get_own_compensation_usecase import GetOwnCompensationUseCase
from app.users.usecases.profiles.get_own_profile_usecase import GetOwnProfileUseCase
from app.users.usecases.profiles.get_own_timesheet_usecase import GetOwnTimesheetUseCase
from app.users.usecases.profiles.get_user_profile_usecase import GetUserProfileUseCase
from app.users.usecases.profiles.upload_own_avatar_usecase import UploadOwnAvatarUseCase
from storage.s3.client import S3Client


class ProfileUsecaseProvider(Provider):
    scope = Scope.REQUEST

    get_own_profile = provide(GetOwnProfileUseCase)
    get_user_profile = provide(GetUserProfileUseCase)
    get_own_compensation = provide(GetOwnCompensationUseCase)
    get_own_timesheet = provide(GetOwnTimesheetUseCase)

    create_employee_profile = provide(CreateEmployeeProfileUseCase)
    update_employee_profile = provide(UpdateEmployeeProfileUseCase)
    delete_employee_profile = provide(DeleteEmployeeProfileUseCase)
    block_employee_profile = provide(BlockEmployeeProfileUseCase)
    unblock_employee_profile = provide(UnblockEmployeeProfileUseCase)
    change_seller_role = provide(ChangeSellerRoleUseCase)
    change_block_member_status = provide(ChangeBlockMemberStatusUseCase)
    upsert_employee_compensation = provide(UpsertEmployeeCompensationUseCase)
    update_time_entry = provide(UpdateTimeEntryUseCase)
    delete_time_entry = provide(DeleteTimeEntryUseCase)

    @provide
    def upload_own_avatar(
        self,
        session: AsyncSession,
        s3_client: S3Client | None = None,
    ) -> UploadOwnAvatarUseCase:
        return UploadOwnAvatarUseCase(session, s3_client)

    @provide
    def upload_timesheet_file(
        self,
        session: AsyncSession,
        s3_client: S3Client | None = None,
    ) -> UploadTimesheetFileUseCase:
        return UploadTimesheetFileUseCase(session, s3_client)
