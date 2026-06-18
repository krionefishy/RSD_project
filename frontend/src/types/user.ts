export type UserRole =
  | "seller"
  | "manager"
  | "admin-edu"
  | "admin-sales"
  | "admin-personnel"
  | "admin-po"
  | "superadmin";

import type { BlockMemberStatus } from "./profile";

export interface AppUser {
  id: string;
  name: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  role: UserRole;
  externalSystemId: string;
  phone?: string;
  avatar?: string;
  position?: string | null;
  store?: string;
  storeName?: string;
  block?: string;
  blockId?: number;
  blockName?: string;
  blockMemberStatus?: BlockMemberStatus;
  isActive?: boolean;
  joinDate?: string;
}
