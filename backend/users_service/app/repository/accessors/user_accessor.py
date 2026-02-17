from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.repository.base import BaseAccessor
from app.repository.models import User


class UserAccessor(BaseAccessor):
    async def get(self, id: int) -> Optional[User]:
        async with self.app.db.session() as session:
            result = await session.execute(select(User).where(User.id == id))
            return result.scalar_one_or_none()

    async def get_all(self) -> list[User]:
        async with self.app.db.session() as session:
            result = await session.execute(select(User))
            return list(result.scalars().all())

    async def create(self, **kwargs: Any) -> User:
        async with self.app.db.session() as session:
            try:
                user = User(**kwargs)
                session.add(user)
                await session.flush()
                await session.refresh(user)
                await session.commit()
                return user
            except IntegrityError:
                await session.rollback()
                raise

    async def update(self, id: int, **kwargs: Any) -> Optional[User]:
        async with self.app.db.session() as session:
            result = await session.execute(select(User).where(User.id == id))
            user = result.scalar_one_or_none()
            if not user:
                return None
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            await session.commit()
            await session.refresh(user)
            return user

    async def delete(self, id: int) -> bool:
        async with self.app.db.session() as session:
            result = await session.execute(select(User).where(User.id == id))
            user = result.scalar_one_or_none()
            if not user:
                return False
            await session.delete(user)
            await session.commit()
            return True
