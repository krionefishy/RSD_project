import re

RU_PHONE_PATTERN = re.compile(
    r"^(\+7|8)(?:[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|\d{10})$"
)

PHONE_VALIDATION_ERROR = (
    "Номер телефона должен начинаться с +7 или 8 и содержать 10 цифр "
    "в формате XXX XXX XX XX"
)


def normalize_ru_phone(phone: str) -> str:
    if not RU_PHONE_PATTERN.fullmatch(phone.strip()):
        raise ValueError(PHONE_VALIDATION_ERROR)

    digits = re.sub(r"\D", "", phone)
    if digits.startswith("8"):
        digits = "7" + digits[1:]

    national = digits[1:]
    return f"+7-{national[:3]}-{national[3:6]}-{national[6:8]}-{national[8:10]}"
