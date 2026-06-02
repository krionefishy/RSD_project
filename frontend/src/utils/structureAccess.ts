import type { UserRole } from "../types/user";

export function canManageStructure(role: UserRole | undefined): boolean {
  return role === "superadmin" || role === "admin-po";
}

export function canViewStructure(role: UserRole | undefined): boolean {
  return (
    role === "superadmin" ||
    role === "admin-po" ||
    role === "admin-personnel" ||
    role === "manager"
  );
}
