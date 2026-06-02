from __future__ import annotations

from uuid import uuid4

import pytest

from app.knowledge_base.domain import UserContext
from app.users.db_models import UserModel, UserRole
from tests.builder import Builder


@pytest.fixture
async def education_admin(builder: Builder) -> UserModel:
    return await builder.build_user(
        external_system_id=f"edu_admin_{uuid4().hex[:8]}",
        role=UserRole.ADMIN_EDUCATION,
    )


def admin_ctx(user: UserModel) -> UserContext:
    return UserContext(user_id=user.id, role=user.role)
