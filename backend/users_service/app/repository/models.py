"""ORM-модели сервиса users (схема согласована на уровне проекта)."""
from sqlalchemy import Column, Integer, String

from app.repository.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
