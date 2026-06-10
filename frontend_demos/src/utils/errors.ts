import { APIError } from "../api/APIClient";

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isAbortError(error: unknown): error is Error {
  return error instanceof Error && error.name === "AbortError";
}

export function getErrorMessage(error: unknown, fallback = "Произошла ошибка"): string {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return fallback;
}
