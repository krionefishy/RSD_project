from shared.di.providers.admin import AdminUsecaseProvider
from shared.di.providers.app import AppProvider, SessionProvider
from shared.di.providers.knowledge_base import KnowledgeBaseUsecaseProvider
from shared.di.providers.sellings import SellingsUsecaseProvider
from shared.di.providers.users import UsersUsecaseProvider

ALL_PROVIDERS = [
    AppProvider(),
    SessionProvider(),
    KnowledgeBaseUsecaseProvider(),
    UsersUsecaseProvider(),
    SellingsUsecaseProvider(),
    AdminUsecaseProvider(),
]
