"""
Списки топиков, на которые подписан этот сервис, и консьюмеры для start_kafka.
Топики — для справки; в start_kafka передаются DOMAIN_CONSUMERS и STORAGE_CONSUMERS.
Обработчики хранятся в consumers/.
"""
from shared.kafka_streams.topics import DomainEvents, Domains, StorageTopics

DOMAIN_TOPICS: list[str] = []
STORAGE_TOPICS: list[str] = []
DOMAIN_CONSUMERS: list = []
STORAGE_CONSUMERS: list = []
