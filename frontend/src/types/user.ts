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
  lastName?: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatar?: string;
  position?: string;
  store?: string;
  block?: string;
  joinDate?: string;
}
