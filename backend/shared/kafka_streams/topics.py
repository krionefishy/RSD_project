"""
Единая стилистика топиков:
- Сторедж (S3):  {PREFIX}.{STORAGE}.{STORAGE_GROUP}.<тип>.upload
- Домен:         {PREFIX}.{DOMAIN}.<домен>.<событие>
"""

PREFIX = "audit_trail"

STORAGE = "storage"
STORAGE_GROUP = "s3"

DOMAIN = "domain"

class Domains:
    ORGANIZATIONS = "organizations"
    USERS = "users"
    CHECKLISTS = "checklists"
    REPORTS = "reports"
    ADMIN = "admin"


def _storage_topic(name: str) -> str:
    return f"{PREFIX}.{STORAGE}.{STORAGE_GROUP}.{name}.upload"


def _domain_topic(domain: str, event: str) -> str:
    return f"{PREFIX}.{DOMAIN}.{domain}.{event}"


class StorageTopics:
    """Топики для загрузки файлов в S3. Добавлять константы по мере надобности."""
    REPORT = _storage_topic("report")
    CHECKLIST_REPORT = _storage_topic("checklist_report")
    AUDIT_REPORT = _storage_topic("audit_report")

    @classmethod
    def all_s3_upload_topics(cls) -> list[str]:
        return [
            cls.REPORT,
            cls.CHECKLIST_REPORT,
            cls.AUDIT_REPORT,
        ]


class DomainEvents:
    """Топики для обмена между микросервисами. Использовать topic(domain, event) или добавить именованные константы."""
    # Примеры именованных событий (раскомментировать/добавить по мере надобности):
    # LINK_EXPIRED = _domain_topic(Domains.ORGANIZATIONS, "link_expired")

    @classmethod
    def topic(cls, domain: str, event: str) -> str:
        """Построить имя доменного топика: domain — из Domains.*, event — snake_case."""
        return _domain_topic(domain, event)
