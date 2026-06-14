from shared.kafka_streams.subscribers.s3 import (
    run_avatar_upload_consumer,
    run_material_attachment_delete_consumer,
    run_material_attachment_upload_consumer,
    run_timesheet_schedule_upload_consumer,
    run_timesheet_upload_consumer,
)

s3_consumers: list = [
    run_avatar_upload_consumer,
    run_material_attachment_upload_consumer,
    run_material_attachment_delete_consumer,
    run_timesheet_upload_consumer,
    run_timesheet_schedule_upload_consumer,
]

__all__ = [
    "s3_consumers",
    "run_avatar_upload_consumer",
    "run_material_attachment_upload_consumer",
    "run_material_attachment_delete_consumer",
    "run_timesheet_upload_consumer",
    "run_timesheet_schedule_upload_consumer",
]
