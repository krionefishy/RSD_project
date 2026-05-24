import { UserRole } from "./user";

export type BlockMemberStatus = "primary" | "reserve";

export interface LocationBrief {
  id: number;
  name: string;
}

export interface BlockBrief {
  id: number;
  name: string;
}

export interface UserProfile {
  id: string;
  externalSystemId: string;
  role: UserRole;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  position?: string;
  avatarUrl?: string;
  isActive: boolean;
  isTempPassword: boolean;
  location?: LocationBrief;
  block?: BlockBrief;
  blockMemberStatus?: BlockMemberStatus;
}

export interface EmployeeCompensation {
  userId: string;
  baseSalary: string;
  hourlyRate: string;
  nightHourlyRate?: string;
  effectiveNightHourlyRate: string;
  updatedAt: string;
}

export interface CreateEmployeeProfileData {
  externalSystemId: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  position?: string;
  locationId?: number | null;
  blockId?: number | null;
  blockMemberStatus?: BlockMemberStatus;
}

export interface UpdateEmployeeProfileData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  position?: string;
  locationId?: number | null;
  blockId?: number | null;
  blockMemberStatus?: BlockMemberStatus;
}

export interface UpsertEmployeeCompensationData {
  baseSalary: string;
  hourlyRate: string;
  nightHourlyRate?: string;
}

export interface CreateEmployeeProfileResult {
  user: UserProfile;
  temporaryPassword: string;
}

export interface OwnTimesheetQuery {
  periodFrom: string;
  periodTo: string;
  locationId?: number;
}

export interface OwnTimesheetEntry {
  id: number;
  workDate: string;
  activityCode: string;
  activityName: string;
  hours: string;
  shiftType: string;
  comment?: string;
}

export interface OwnTimesheet {
  items: OwnTimesheetEntry[];
  periodFrom: string;
  periodTo: string;
  totalHours: string;
}
