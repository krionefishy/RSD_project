import pytest
from jose import jwt

from shared.service_auth.token import ServiceTokenError, create_service_token, decode_service_token
from shared.settings.config import ServiceJWTConfig


@pytest.fixture
def service_jwt_config() -> ServiceJWTConfig:
    return ServiceJWTConfig(
        secret="test-inter-service-secret",
        algorithm="HS256",
        issuer="rsd-backend",
        audience="rsd-report-service",
        expire_seconds=300,
        allowed_subjects=("backend",),
    )


def test_create_and_decode_service_token(service_jwt_config: ServiceJWTConfig) -> None:
    token = create_service_token(service_jwt_config, subject="backend")
    payload = decode_service_token(token, service_jwt_config)
    assert payload["sub"] == "backend"
    assert payload["type"] == "service"
    assert payload["iss"] == "rsd-backend"
    assert payload["aud"] == "rsd-report-service"


def test_rejects_disallowed_subject(service_jwt_config: ServiceJWTConfig) -> None:
    with pytest.raises(ServiceTokenError):
        create_service_token(service_jwt_config, subject="unknown")


def test_rejects_user_token(service_jwt_config: ServiceJWTConfig) -> None:
    user_token = jwt.encode(
        {"sub": "user-1", "type": "access"},
        "wrong-secret",
        algorithm="HS256",
    )
    with pytest.raises(ServiceTokenError):
        decode_service_token(user_token, service_jwt_config)
