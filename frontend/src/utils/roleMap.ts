import { UserRole } from "../types/user";

export type BackendRole =
  | "super_admin"
  | "root_admin"
  | "admin_staff"
  | "admin_education"
  | "admin_sales"
  | "manager"
  | "seller";

const BACKEND_TO_FRONTEND: Record<BackendRole, UserRole> = {
  super_admin: "superadmin",
  root_admin: "admin-po",
  admin_staff: "admin-personnel",
  admin_education: "admin-edu",
  admin_sales: "admin-sales",
  manager: "manager",
  seller: "seller",
};

const FRONTEND_TO_BACKEND: Record<UserRole, BackendRole> = {
  superadmin: "super_admin",
  "admin-personnel": "admin_staff",
  "admin-edu": "admin_education",
  "admin-sales": "admin_sales",
  "admin-po": "root_admin",
  manager: "manager",
  seller: "seller",
};

export const roleRoutes: Record<UserRole, string> = {
  seller: "/seller",
  manager: "/manager",
  "admin-edu": "/admin-edu",
  "admin-sales": "/admin-sales",
  "admin-personnel": "/admin-personnel",
  "admin-po": "/admin-po",
  superadmin: "/superadmin",
};

export function toFrontendRole(role: string): UserRole {
  if (role in BACKEND_TO_FRONTEND) {
    return BACKEND_TO_FRONTEND[role as BackendRole];
  }
  return role as UserRole;
}

export function toBackendRole(role: UserRole): BackendRole {
  return FRONTEND_TO_BACKEND[role];
}
