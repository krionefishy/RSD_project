import secrets
import string

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.errors import DecryptFailedError
from app.auth.password import DecryptError, PasswordService
from app.users.db_models import UserModel
from app.users.domain import UserCreate
from app.users.dto import UserCreateResultDTO, UserDTO


def _generate_temp_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class CreateUserUseCase:
    def __init__(self, session: AsyncSession, password_service: PasswordService):
        self.session = session
        self.password_service = password_service

    async def execute(self, request: UserCreate) -> UserCreateResultDTO:
        exists_result = await self.session.execute(
            select(UserModel).where(UserModel.external_system_id == request.external_system_id)
        )
        if exists_result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="external_system_id already exists",
            )

        raw_password = request.password
        if request.encrypted_password:
            try:
                raw_password = self.password_service.decrypt(request.encrypted_password)
            except DecryptError as exc:
                raise DecryptFailedError() from exc

        if not raw_password:
            raw_password = _generate_temp_password()

        hashed_password = self.password_service.hash(raw_password)

        user = UserModel(
            external_system_id=request.external_system_id,
            hashed_password=hashed_password,
            role=request.role,
            first_name=request.first_name,
            last_name=request.last_name,
            phone=request.phone,
            position=request.position,
            is_active=True,
            is_temp_password=True,
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)

        return UserCreateResultDTO(
            user=UserDTO(
                id=user.id,
                external_system_id=user.external_system_id,
                role=user.role,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                name=user.full_name,
                position=user.position,
                avatar_url=user.avatar_url,
                is_active=user.is_active,
                is_temp_password=user.is_temp_password,
            ),
            temp_password=raw_password,
        )
