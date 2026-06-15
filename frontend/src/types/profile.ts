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

export type ShiftType = "day" | "night" | "none";
export type ScheduleShiftCode = "С1" | "С2" | "В" | "О/Б";

export interface TimesheetEntry {
  id: number;
  workDate: string;
  activityCode: string;
  activityName: string;
  hours: string;
  shiftType: ShiftType;
  shiftCode?: ScheduleShiftCode;
  startsAt?: string;
  endsAt?: string;
  userId?: string;
  userName?: string;
  locationName?: string;
}

export type OwnTimesheetEntry = TimesheetEntry;

export interface OwnTimesheet {
  items: TimesheetEntry[];
  periodFrom: string;
  periodTo: string;
  totalHours: string;
}

export interface LocationTimesheet {
  location: LocationBrief;
  items: TimesheetEntry[];
  totalHours: string;
}

export interface TimesheetImportError {
  row?: number | null;
  column?: string | null;
  message: string;
}

export interface TimesheetUploadResult {
  entriesCount: number;
  rowsCount: number;
  errors: TimesheetImportError[];
}

export interface UpdateTimeEntryData {
  activityCode?: string;
  hours?: string;
  shiftType?: ShiftType;
}

export interface CreateTimeEntryData {
  userId: string;
  workDate: string;
  shiftCode: "С1" | "С2";
  locationId?: number;
}

export interface PersonnelOverview {
  employeesCount: number;
  locationsCount: number;
  blocksCount: number;
}
