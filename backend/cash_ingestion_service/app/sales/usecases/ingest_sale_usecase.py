from datetime import datetime

from shared.kafka_streams.producer import KafkaProducerWrapper
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.sales.db_models import IncomingSaleModel
from app.sales.domain import IncomingSalePayload
from app.sales.dto import IncomingSaleDTO


class IngestSaleUseCase:
    def __init__(self, session: AsyncSession, kafka_producer: KafkaProducerWrapper):
        self.session = session
        self.kafka_producer = kafka_producer

    async def execute(self, payload: IncomingSalePayload) -> IncomingSaleDTO:
        existing_result = await self.session.execute(
            select(IncomingSaleModel).where(
                IncomingSaleModel.cashbox_id == payload.cashbox_id,
                IncomingSaleModel.external_sale_id == payload.external_sale_id,
            )
        )
        existing = existing_result.scalar_one_or_none()
        if existing is not None:
            return IncomingSaleDTO(
                id=existing.id,
                cashbox_id=existing.cashbox_id,
                external_sale_id=existing.external_sale_id,
                status="duplicate",
                received_at=existing.received_at,
            )

        sale = IncomingSaleModel(
            cashbox_id=payload.cashbox_id,
            external_sale_id=payload.external_sale_id,
            occurred_at=payload.occurred_at,
            received_at=datetime.now(),
            total_amount=payload.total_amount,
            currency=payload.currency,
            status="received",
            payload=payload.payload,
        )
        self.session.add(sale)
        await self.session.flush()

        await self.kafka_producer.send(
            "cash.sales.received",
            {
                "id": str(sale.id),
                "cashbox_id": sale.cashbox_id,
                "external_sale_id": sale.external_sale_id,
                "occurred_at": sale.occurred_at.isoformat(),
            },
        )
        sale.status = "queued"
        await self.session.commit()

        return IncomingSaleDTO(
            id=sale.id,
            cashbox_id=sale.cashbox_id,
            external_sale_id=sale.external_sale_id,
            status=sale.status,
            received_at=sale.received_at,
        )
