from shared.kafka_streams.producer import KafkaProducerWrapper
from shared.kafka_streams.storage_events import publish_s3_delete
from shared.kafka_streams.topics import StorageTopics
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge_base.access import KB_ADMIN_ROLES
from app.knowledge_base.db_models import MaterialAttachmentModel
from app.knowledge_base.domain import UserContext


class DeleteMaterialAttachmentUseCase:
    def __init__(self, session: AsyncSession, kafka_producer: KafkaProducerWrapper):
        self.session = session
        self.kafka_producer = kafka_producer

    async def execute(
        self,
        material_id: int,
        attachment_id: int,
        ctx: UserContext,
    ) -> bool | None:
        if ctx.role.value not in KB_ADMIN_ROLES:
            return None

        attachment = (
            await self.session.execute(
                select(MaterialAttachmentModel).where(
                    MaterialAttachmentModel.id == attachment_id,
                    MaterialAttachmentModel.material_id == material_id,
                )
            )
        ).scalar_one_or_none()
        if attachment is None:
            return None

        s3_file_key = attachment.s3_file_key

        await self.session.delete(attachment)
        await self.session.commit()
        await publish_s3_delete(
            self.kafka_producer,
            StorageTopics.MATERIAL_ATTACHMENT_DELETE,
            key=s3_file_key,
            metadata={
                "material_id": str(material_id),
                "attachment_id": str(attachment_id),
            },
        )
        return True
