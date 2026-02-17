"""
Списки топиков, на которые подписан этот сервис, и консьюмеры для start_kafka.
Топики — для справки; в start_kafka передаются DOMAIN_CONSUMERS и STORAGE_CONSUMERS.
Обработчики хранятся в consumers/.
"""
from shared.kafka_streams.topics import DomainEvents, Domains, StorageTopics

# Топики доменных событий (константы), на которые подписан сервис
DOMAIN_TOPICS: list[str] = []

# Топики стореджа (S3), на которые подписан сервис
STORAGE_TOPICS: list[str] = []

# Консьюмеры для start_kafka(..., domain_consumers=DOMAIN_CONSUMERS)
DOMAIN_CONSUMERS: list = []

# Консьюмеры для start_kafka(..., consumers=STORAGE_CONSUMERS)
STORAGE_CONSUMERS: list = []
