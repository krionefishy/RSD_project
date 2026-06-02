from app.personnel.db_models import EmployeeCompensationModel
from app.personnel.dto import EmployeeCompensationDTO


def map_compensation(model: EmployeeCompensationModel) -> EmployeeCompensationDTO:
    return EmployeeCompensationDTO(
        user_id=model.user_id,
        base_salary=model.base_salary,
        hourly_rate=model.hourly_rate,
        night_hourly_rate=model.night_hourly_rate,
        effective_night_hourly_rate=model.effective_night_hourly_rate,
        updated_at=model.updated_at,
    )
