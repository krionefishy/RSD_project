from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class IncomingSaleDTO(BaseModel):
    id: UUID
    cashbox_id: str
    external_sale_id: str
    status: str
    received_at: datetime
