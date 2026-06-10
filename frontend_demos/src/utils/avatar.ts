import { APIError } from "../api/APIClient";

export const AVATAR_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_ACCEPT = AVATAR_ALLOWED_MIME_TYPES.join(",");
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function validateAvatarFile(file: File): string | null {
  if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number])) {
    return "Поддерживаются только JPEG, PNG и WebP";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "Размер файла не должен превышать 5 МБ";
  }
  if (file.size === 0) {
    return "Файл пустой";
  }
  return null;
}

export function mapAvatarErrorMessage(error: unknown, fallback = "Не удалось загрузить аватар"): string {
  if (error instanceof APIError) {
    switch (error.code) {
      case "UNSUPPORTED_IMAGE_TYPE":
        return "Поддерживаются только JPEG, PNG и WebP";
      case "FILE_TOO_LARGE":
        return "Размер файла не должен превышать 5 МБ";
      case "EMPTY_FILE":
        return "Файл пустой";
      default:
        break;
    }
    if (error.message === "Unsupported image type") return "Поддерживаются только JPEG, PNG и WebP";
    if (error.message === "File is too large") return "Размер файла не должен превышать 5 МБ";
    if (error.message === "Empty file") return "Файл пустой";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
