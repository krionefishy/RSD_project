from pydantic import BaseModel


class PersonnelOverviewDTO(BaseModel):
    employees_count: int
    locations_count: int
    blocks_count: int
