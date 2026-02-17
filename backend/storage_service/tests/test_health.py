"""Минимальный тест: health endpoint (при запуске с config.test.yaml)."""
import pytest
from fastapi.testclient import TestClient

from app.api.app import app


@pytest.fixture
def client():
    return TestClient(app.app)


def test_health(client: TestClient):
    # app создаётся при импорте; для теста нужен config.test.yaml
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("service") == "storage"
