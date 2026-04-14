export type UserRole =
  | "seller"
  | "manager"
  | "admin-edu"
  | "admin-sales"
  | "admin-personnel"
  | "admin-po"
  | "superadmin";

export interface AppUser {
  id: string;
  name: string;
  firstName: string;
  role: UserRole;
  position: string;
  store: string;
  block: string;
  email: string;
  phone: string;
  avatar?: string;
  joinDate: string;
}
