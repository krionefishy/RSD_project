# Test Rules

## File Structure

All test files must follow this structure:

```
tests/
    logical_entity/          (e.g., users, knowledge_base)
        usecases/           # Usecase tests
        api/                # API/endpoint tests
    conftest.py             # Shared fixtures
    builder.py              # Test data builder
    mocks/                  # Mock implementations
        broker.py
        storage.py
        __init__.py
```

## Import Rules

1. **ALL imports must be at the top of the file** - no inline imports inside functions
2. Use `from __future__ import annotations` as the first import line
3. Order: stdlib → third-party → first-party (app, tests)
4. Group imports with blank lines between groups

Example:
```python
from __future__ import annotations

from datetime import datetime
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.users.db_models import UserModel
from tests.builder import Builder
```

## No Comments in Test Code

1. **No docstrings at the top of test files**
2. **No comments in test methods** - code should be self-explanatory
3. Use descriptive test method names instead of comments
4. Test class docstrings are allowed but should be minimal

Allowed:
```python
class TestGetUserUseCase:
    async def test_returns_user_dto_when_user_exists(self, db_session, builder):
        user = await builder.build_user(external_system_id="test_123")
        result = await GetUserUseCase(db_session).execute(user.id)
        assert result is not None
```

Not allowed:
```python
class TestGetUserUseCase:
    """Test suite for GetUserUseCase."""  # NO!

    async def test_returns_user_dto_when_user_exists(self, db_session, builder):
        """Test that usecase returns UserDTO when user exists."""  # NO!
        # Create user with specific data via Builder  # NO!
        user = await builder.build_user(external_system_id="test_123")
        # Execute usecase  # NO!
        result = await GetUserUseCase(db_session).execute(user.id)
        # Verify result  # NO!
        assert result is not None
```

## Test Method Naming

- Use `test_<action>_<condition>_<expected_result>` pattern
- Be explicit and descriptive
- No underscores in test class names (use CamelCase)

Examples:
- `test_returns_user_dto_when_user_exists`
- `test_returns_none_when_user_not_found`
- `test_creates_user_with_valid_data`

## Test Fixtures

- All fixtures go in `conftest.py`
- Use type hints for all fixture parameters
- Use `frozen_datetime` fixture for deterministic timestamps
- Use `builder` fixture for test data creation

## Test Data

- Use `Builder` class for creating test entities
- Never use raw SQL in tests
- Use `frozen_datetime` for consistent timestamps
- Clean up test data via transaction rollback

## Assertions

- Use specific assertions, not `assert True`
- Test one thing per test method
- Use helper methods for complex assertions
