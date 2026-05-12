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

## Test Isolation Rules

### Unit Tests (Usecase Tests)

**Usecase tests must be PURE unit tests - NO external service calls:**

1. **Never instantiate real external clients in usecase tests**
   - S3Client must be mocked (use MockS3Client)
   - Kafka must be mocked (use FakeKafkaBroker)
   - HTTP clients must be mocked
   - Database is the only real dependency allowed

2. **Usecase tests should only test:**
   - Business logic inside the usecase
   - Database queries via SQLAlchemy
   - Pure transformations and calculations

3. **Forbidden in usecase tests:**
   ```python
   # NO: Creating real S3Client
   s3 = S3Client(endpoint_url="...", ...)  # This hits real S3!
   
   # NO: Full application startup
   app = create_app()  # This starts all services!
   
   # NO: Real HTTP calls
   requests.get("http://external-api.com/...")
   ```

4. **Allowed in usecase tests:**
   ```python
   # YES: Mock S3Client
   mock_s3 = MockS3Client()
   usecase = UploadAvatarUseCase(session, mock_s3)
   
   # YES: Direct usecase instantiation with minimal deps
   usecase = GetUserUseCase(db_session)
   result = await usecase.execute(user_id)
   ```

### Integration Tests (API Tests)

API tests in `tests/<entity>/api/` can use full application context but must:
- Mock external HTTP calls (aioresponses)
- Use testcontainers or local test databases
- Not hit production services

## Service Mocking

### S3 (MinIO/AWS)
```python
from tests.mocks import MockS3Client

mock_s3 = MockS3Client()
mock_s3._uploads["test-key"] = b"test data"
```

### Kafka
```python
from tests.mocks import FakeKafkaBroker

broker = FakeKafkaBroker()
await broker.publish({"event": "test"}, "topic")
assert len(broker.published) == 1
```

### HTTP APIs
```python
from aioresponses import aioresponses

with aioresponses() as m:
    m.get("http://external-api.com/user/1", payload={"id": 1})
    result = await client.get_user(1)
```

## Database Rules

1. **Use transactional rollback** - never commit in tests
2. **Use Builder** for test data creation
3. **Don't use production database** - use rsd_test
4. **Reset state between tests** via fixtures

## Running Tests

```bash
# Run all tests
just test

# Run specific test file
just test-file tests/usecases/test_get_user_usecase.py

# Run with pattern
just test-pattern test_returns_user

# Reset test DB and run
just test-full-reset
```
