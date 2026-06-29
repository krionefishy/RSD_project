import pytest

from shared.phone import PHONE_VALIDATION_ERROR, normalize_ru_phone


@pytest.mark.parametrize(
    "phone",
    [
        "+7-999-123-45-67",
        "+7 999 123 45 67",
        "+79991234567",
        "89991234567",
        "8 999 123 45 67",
        "8-999-123-45-67",
    ],
)
def test_normalize_ru_phone_accepts_valid_formats(phone: str) -> None:
    assert normalize_ru_phone(phone) == "+7-999-123-45-67"


@pytest.mark.parametrize(
    "phone",
    [
        "abc",
        "+7999",
        "12345678901",
        "+1-999-123-45-67",
        "+7-999-123-45-6",
        "7-999-123-45-67",
    ],
)
def test_normalize_ru_phone_rejects_invalid_formats(phone: str) -> None:
    with pytest.raises(ValueError) as exc_info:
        normalize_ru_phone(phone)
    assert str(exc_info.value) == PHONE_VALIDATION_ERROR
