from datetime import date
from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.auth.deps import AuthContext, require_auth
from app.personnel.domain import TimesheetPeriodQuery
from app.personnel.dto import EmployeeCompensationDTO, OwnTimesheetDTO
from app.users.domain import UpdateOwnPhoneRequest
from app.users.dto import AvatarUploadResultDTO, UserDTO, UserProfileDTO
from app.users.usecases.profiles.get_own_compensation_usecase import GetOwnCompensationUseCase
from app.users.usecases.profiles.get_own_profile_usecase import GetOwnProfileUseCase
from app.users.usecases.profiles.get_own_timesheet_usecase import GetOwnTimesheetUseCase
from app.users.usecases.profiles.get_user_profile_usecase import GetUserProfileUseCase
from app.users.usecases.profiles.update_own_phone_usecase import UpdateOwnPhoneUseCase
from app.users.usecases.profiles.upload_own_avatar_usecase import UploadOwnAvatarUseCase

router = APIRouter(route_class=DishkaRoute)


@router.get("/me/profile", response_model=UserProfileDTO, summary="Свой профиль")
async def get_own_profile(
    auth: Annotated[AuthContext, Depends(require_auth)],
    usecase: FromDishka[GetOwnProfileUseCase],
) -> UserProfileDTO:
    return await usecase.execute(auth)


@router.get("/{user_id}/profile", response_model=UserProfileDTO, summary="Профиль пользователя")
async def get_user_profile(
    user_id: UUID,
    auth: Annotated[AuthContext, Depends(require_auth)],
    usecase: FromDishka[GetUserProfileUseCase],
) -> UserProfileDTO:
    return await usecase.execute(user_id, auth)


@router.patch("/me/phone", response_model=UserDTO, summary="Обновить свой телефон")
async def update_own_phone(
    body: UpdateOwnPhoneRequest,
    auth: Annotated[AuthContext, Depends(require_auth)],
    usecase: FromDishka[UpdateOwnPhoneUseCase],
) -> UserDTO:
    result = await usecase.execute(auth, body.phone)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return result


@router.post("/me/avatar", response_model=AvatarUploadResultDTO, summary="Загрузить свой аватар")
async def upload_own_avatar(
    file: UploadFile,
    auth: Annotated[AuthContext, Depends(require_auth)],
    usecase: FromDishka[UploadOwnAvatarUseCase],
) -> AvatarUploadResultDTO:
    payload = await file.read()
    avatar_url = await usecase.execute(
        auth,
        filename=file.filename or "avatar",
        content_type=file.content_type or "application/octet-stream",
        payload=payload,
    )
    return AvatarUploadResultDTO(avatar_url=avatar_url)


@router.get(
    "/me/compensation",
    response_model=EmployeeCompensationDTO | None,
    summary="Своя ставка и оклад",
)
async def get_own_compensation(
    auth: Annotated[AuthContext, Depends(require_auth)],
    usecase: FromDishka[GetOwnCompensationUseCase],
) -> EmployeeCompensationDTO | None:
    return await usecase.execute(auth)


@router.get("/me/timesheet", response_model=OwnTimesheetDTO, summary="Свой табель-график")
async def get_own_timesheet(
    auth: Annotated[AuthContext, Depends(require_auth)],
    usecase: FromDishka[GetOwnTimesheetUseCase],
    period_from: date,
    period_to: date,
    location_id: int | None = None,
) -> OwnTimesheetDTO:
    query = TimesheetPeriodQuery(
        period_from=period_from,
        period_to=period_to,
        location_id=location_id,
    )
    return await usecase.execute(query, auth)
