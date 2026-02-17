from sqlalchemy import Column, Integer

from app.repository.base import Base

# TODO: модели чек-листов, категорий, проведённых аудитов (согласовать схему)


class ChecklistPlaceholder(Base):
    __tablename__ = "checklists_placeholder"

    id = Column(Integer, primary_key=True)
