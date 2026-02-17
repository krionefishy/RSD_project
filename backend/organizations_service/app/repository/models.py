from sqlalchemy import Column, Integer, String

from app.repository.base import Base


class OKKPlaceholder(Base):
    """ОКК — отдел контроля качества."""

    __tablename__ = "okk_placeholder"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)


class CheckObjectPlaceholder(Base):
    """Объект проверки."""

    __tablename__ = "check_objects_placeholder"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
