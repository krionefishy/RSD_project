from decimal import Decimal

from app.personnel.db_models import EmployeeTimeEntryModel
from app.personnel.dto import EmployeeTimeEntryDTO
from app.users.dto import LocationBriefDTO, UserBriefDTO


def map_time_entry(entry: EmployeeTimeEntryModel, location_name: str | None = None) -> EmployeeTimeEntryDTO:
    user = entry.user
    location = user.location if user is not None else None
    return EmployeeTimeEntryDTO(
        id=entry.id,
        user_id=entry.user_id,
        user=UserBriefDTO(
            id=user.id,
            external_system_id=user.external_system_id,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
        ),
        location=(
            LocationBriefDTO(id=location.id, name=location.name)
            if location is not None
            else (
                LocationBriefDTO(id=0, name=location_name)
                if location_name is not None
                else None
            )
        ),
        work_date=entry.work_date,
        activity_code=entry.activity_code,
        activity_name=entry.activity_code_ref.name if entry.activity_code_ref else entry.activity_code,
        hours=entry.hours,
        shift_type=entry.shift_type,
        shift_code=entry.shift_code,
        starts_at=entry.starts_at.isoformat(timespec="minutes") if entry.starts_at else None,
        ends_at=entry.ends_at.isoformat(timespec="minutes") if entry.ends_at else None,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


def sum_worked_hours(entries: list[EmployeeTimeEntryModel]) -> Decimal:
    total = Decimal("0")
    for entry in entries:
        ref = entry.activity_code_ref
        if ref is not None and ref.is_worked_time:
            total += entry.hours
    return total
