import secrets
import string

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.staff_admin.profile_helpers import (
    assign_user_block,
    assign_user_location,
    ensure_location_in_block,
)
from app.auth.deps import AuthContext
from app.auth.password import PasswordService
from app.personnel.domain import CreateEmployeeProfileRequest
from app.personnel.dto import CreateEmployeeProfileResultDTO
from app.users.db_models import UserModel, UserRole
from app.users.profile_errors import ProfileConflictError
from app.users.profile_mapper import load_user_for_profile, map_user_profile
from app.users.profile_scope import require_staff_admin


def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class CreateEmployeeProfileUseCase:
    def __init__(self, session: AsyncSession, password_service: PasswordService):
        self.session = session
        self.password_service = password_service

    async def execute(
        self,
        request: CreateEmployeeProfileRequest,
        ctx: AuthContext,
    ) -> CreateEmployeeProfileResultDTO:
        require_staff_admin(ctx)

        exists = await self.session.execute(
            select(UserModel.id).where(UserModel.external_system_id == request.external_system_id)
        )
        if exists.scalar_one_or_none() is not None:
            raise ProfileConflictError("external_system_id already exists")

        if request.location_id is not None and request.block_id is not None:
            await ensure_location_in_block(self.session, request.block_id, request.location_id)

        temp_password = _generate_temp_password()
        user = UserModel(
            external_system_id=request.external_system_id,
            hashed_password=self.password_service.hash(temp_password),
            role=UserRole.SELLER,
            first_name=request.first_name,
            middle_name=request.middle_name,
            last_name=request.last_name,
            phone=request.phone,
            birth_date=request.birth_date,
            position=request.position,
            is_active=True,
        )
        self.session.add(user)
        await self.session.flush()

        if request.location_id is not None:
            await assign_user_location(self.session, user.id, request.location_id)
        if request.block_id is not None:
            await assign_user_block(
                self.session,
                user.id,
                request.block_id,
                status=request.block_member_status,
            )

        await self.session.commit()
        loaded = await load_user_for_profile(self.session, user.id)
        if loaded is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User not created")
        return CreateEmployeeProfileResultDTO(
            user=map_user_profile(loaded),
            temp_password=temp_password,
        )
