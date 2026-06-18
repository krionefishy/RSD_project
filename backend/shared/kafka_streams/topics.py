class StorageTopics:
    SERVICE = "storage"
    GROUP = "s3"

    AVATAR_UPLOAD = f"{SERVICE}.{GROUP}.avatar.upload"
    MATERIAL_ATTACHMENT_UPLOAD = f"{SERVICE}.{GROUP}.material_attachment.upload"
    MATERIAL_ATTACHMENT_DELETE = f"{SERVICE}.{GROUP}.material_attachment.delete"
    TIMESHEET_UPLOAD = f"{SERVICE}.{GROUP}.timesheet.upload"
    TIMESHEET_SCHEDULE_UPLOAD = f"{SERVICE}.{GROUP}.timesheet_schedule.upload"
    LEARNING_REPORT_UPLOAD = f"{SERVICE}.{GROUP}.learning_report.upload"

    @classmethod
    def all_s3_mutation_topics(cls) -> list[str]:
        return [
            cls.AVATAR_UPLOAD,
            cls.MATERIAL_ATTACHMENT_UPLOAD,
            cls.MATERIAL_ATTACHMENT_DELETE,
            cls.TIMESHEET_UPLOAD,
            cls.TIMESHEET_SCHEDULE_UPLOAD,
            cls.LEARNING_REPORT_UPLOAD,
        ]
