from sqlalchemy import Column, Integer

from app.repository.base import Base


class ReportPlaceholder(Base):
    __tablename__ = "reports_placeholder"

    id = Column(Integer, primary_key=True)
