"""
Топики стореджа и консьюмеры для start_kafka.
"""
from shared.kafka_streams.topics import StorageTopics

from app.streams.consumers import handle_audit_report, handle_checklist_report, handle_report

STORAGE_TOPICS: list[str] = [
    StorageTopics.REPORT,
    StorageTopics.CHECKLIST_REPORT,
    StorageTopics.AUDIT_REPORT,
]

STORAGE_CONSUMERS = [handle_report, handle_checklist_report, handle_audit_report]
DOMAIN_TOPICS: list[str] = []
DOMAIN_CONSUMERS: list = []
