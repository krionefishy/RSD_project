import type { UserRole } from "../types/user";

const STORAGE_KEY = "presentation_role";

export function setPresentationRole(role: UserRole): void {
  sessionStorage.setItem(STORAGE_KEY, role);
}

export function getPresentationRole(): UserRole | null {
  const value = sessionStorage.getItem(STORAGE_KEY);
  return value as UserRole | null;
}

export function clearPresentationRole(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
