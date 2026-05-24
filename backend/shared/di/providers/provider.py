from dishka.integrations.fastapi import FastapiProvider

from shared.di.providers.admin import AdminUsecaseProvider
from shared.di.providers.app import AppProvider, SessionProvider
from shared.di.providers.auth import AuthContextProvider, AuthProvider, AuthUsecaseProvider
from shared.di.providers.knowledge_base import KnowledgeBaseUsecaseProvider
from shared.di.providers.personnel import PersonnelUsecaseProvider
from shared.di.providers.profile import ProfileUsecaseProvider
from shared.di.providers.sellings import SellingsUsecaseProvider
from shared.di.providers.locations import LocationsUsecaseProvider
from shared.di.providers.users import UsersUsecaseProvider

ALL_PROVIDERS = [
    AppProvider(),
    SessionProvider(),
    FastapiProvider(),
    AuthProvider(),
    AuthContextProvider(),
    AuthUsecaseProvider(),
    KnowledgeBaseUsecaseProvider(),
    UsersUsecaseProvider(),
    LocationsUsecaseProvider(),
    ProfileUsecaseProvider(),
    PersonnelUsecaseProvider(),
    SellingsUsecaseProvider(),
    AdminUsecaseProvider(),
]
