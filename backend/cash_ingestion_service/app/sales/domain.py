from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class IncomingSalePayload(BaseModel):
    cashbox_id: str = Field(min_length=1, max_length=100)
    external_sale_id: str = Field(min_length=1, max_length=120)
    occurred_at: datetime
    total_amount: Decimal = Field(ge=0)
    currency: str = Field(default="RUB", min_length=3, max_length=3)
    payload: dict
