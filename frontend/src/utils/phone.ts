const RU_PHONE_PATTERN =
  /^(\+7|8)(?:[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\d{10})$/;

export const PHONE_VALIDATION_ERROR =
  "Номер телефона должен начинаться с +7 или 8 и содержать 10 цифр в формате XXX XXX XX XX";

export function validateRuPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return null;
  }
  if (!RU_PHONE_PATTERN.test(trimmed)) {
    return PHONE_VALIDATION_ERROR;
  }
  return null;
}
