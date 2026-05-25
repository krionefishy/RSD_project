import type { AppUser, UserRole } from "../types/user";
import type {
  EmployeeCompensation,
  OwnTimesheet,
  OwnTimesheetQuery,
  ShiftType,
  UserProfile,
} from "../types/profile";
import { toFrontendRole, toBackendRole } from "../utils/roleMap";
import { apiClient } from "./APIClient";

function isMockAuth(): boolean {
  return import.meta.env.VITE_MOCK_AUTH === "true";
}

const MOCK_USER: AppUser = {
  id: "mock-seller-uuid",
  name: "Seller User",
  firstName: "Seller",
  lastName: "User",
  role: "seller",
  externalSystemId: "seller_001",
  isActive: true,
};

function buildDisplayName(
  first?: string | null,
  middle?: string | null,
  last?: string | null,
  externalSystemId?: string | null,
): string {
  const parts = [first, middle, last].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  return externalSystemId ?? "";
}

interface LocationBriefDTO {
  id: number;
  name: string;
}

interface BlockBriefDTO {
  id: number;
  name: string;
}

interface UserResponse {
  id: string;
  external_system_id?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  phone?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  position?: string | null;
  managed_block?: BlockBriefDTO | null;
  block?: BlockBriefDTO | null;
  block_member_status?: string | null;
  location?: LocationBriefDTO | null;
  is_active?: boolean;
}

interface UserProfileDTO {
  id: string;
  external_system_id: string;
  role: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  position?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  is_temp_password: boolean;
  location?: LocationBriefDTO | null;
  block?: BlockBriefDTO | null;
  block_member_status?: string | null;
}

interface EmployeeCompensationDTO {
  user_id: string;
  base_salary: string;
  hourly_rate: string;
  night_hourly_rate?: string | null;
  effective_night_hourly_rate: string;
  updated_at: string;
}

interface OwnTimesheetEntryDTO {
  id: number;
  work_date: string;
  activity_code: string;
  activity_name: string;
  hours: string;
  shift_type: string;
  comment?: string | null;
}

interface OwnTimesheetDTO {
  items: OwnTimesheetEntryDTO[];
  period_from: string;
  period_to: string;
  total_hours: string;
}

function mapUserResponse(response: UserResponse): AppUser {
  const role = toFrontendRole(response.role ?? "seller");
  const firstName = response.first_name ?? "";
  const middleName = response.middle_name ?? undefined;
  const lastName = response.last_name ?? undefined;
  const externalSystemId = response.external_system_id ?? "";

  return {
    id: response.id,
    name:
      response.name ??
      buildDisplayName(firstName, middleName, lastName, externalSystemId),
    firstName: firstName || buildDisplayName(firstName, middleName, lastName, externalSystemId),
    middleName,
    lastName: lastName || undefined,
    role,
    externalSystemId,
    phone: response.phone ?? undefined,
    avatar: response.avatar_url ?? undefined,
    position: response.position ?? undefined,
    block: response.block?.name
      ? response.block.name
      : response.block?.id
      ? String(response.block.id)
      : response.managed_block?.name
        ? response.managed_block.name
        : response.managed_block?.id
        ? String(response.managed_block.id)
        : undefined,
    blockName: response.block?.name ?? response.managed_block?.name,
    blockMemberStatus:
      response.block_member_status === "primary" || response.block_member_status === "reserve"
        ? response.block_member_status
        : undefined,
    store: response.location?.name ?? (response.location?.id ? String(response.location.id) : undefined),
    storeName: response.location?.name,
    isActive: response.is_active,
  };
}

function mapProfile(dto: UserProfileDTO): UserProfile {
  const status = dto.block_member_status?.toLowerCase();
  return {
    id: dto.id,
    externalSystemId: dto.external_system_id,
    role: toFrontendRole(dto.role),
    firstName: dto.first_name ?? undefined,
    middleName: dto.middle_name ?? undefined,
    lastName: dto.last_name ?? undefined,
    phone: dto.phone ?? undefined,
    birthDate: dto.birth_date ?? undefined,
    position: dto.position ?? undefined,
    avatarUrl: dto.avatar_url ?? undefined,
    isActive: dto.is_active,
    isTempPassword: dto.is_temp_password,
    location: dto.location ?? undefined,
    block: dto.block ?? undefined,
    blockMemberStatus:
      status === "primary" || status === "reserve" ? status : undefined,
  };
}

function mapCompensation(dto: EmployeeCompensationDTO): EmployeeCompensation {
  return {
    userId: dto.user_id,
    baseSalary: dto.base_salary,
    hourlyRate: dto.hourly_rate,
    nightHourlyRate: dto.night_hourly_rate ?? undefined,
    effectiveNightHourlyRate: dto.effective_night_hourly_rate,
    updatedAt: dto.updated_at,
  };
}

export interface UsersListFilters {
  blockId?: string;
  role?: UserRole | string;
  locationId?: string;
  isActive?: boolean;
}

interface UsersListDTO {
  items: UserResponse[];
  total: number;
}

class UserAPIImpl {
  async fetchMe(signal?: AbortSignal): Promise<AppUser> {
    if (isMockAuth()) {
      return MOCK_USER;
    }

    const response = await apiClient.get<UserResponse>("/users/me", { signal });
    return mapUserResponse(response);
  }

  async getOwnProfile(signal?: AbortSignal): Promise<UserProfile> {
    if (isMockAuth()) {
      return {
        id: MOCK_USER.id,
        externalSystemId: MOCK_USER.externalSystemId,
        role: MOCK_USER.role,
        firstName: MOCK_USER.firstName,
        lastName: MOCK_USER.lastName,
        isActive: true,
        isTempPassword: false,
      };
    }
    const response = await apiClient.get<UserProfileDTO>("/users/me/profile", { signal });
    return mapProfile(response);
  }

  async getUserProfile(userId: string, signal?: AbortSignal): Promise<UserProfile> {
    if (isMockAuth()) {
      return {
        id: userId,
        externalSystemId: "mock_001",
        role: "seller",
        firstName: "Mock",
        isActive: true,
        isTempPassword: false,
      };
    }
    const response = await apiClient.get<UserProfileDTO>(`/users/${userId}/profile`, { signal });
    return mapProfile(response);
  }

  async getUser(userId: string, signal?: AbortSignal): Promise<AppUser> {
    if (isMockAuth()) {
      return { ...MOCK_USER, id: userId, name: `User ${userId}` };
    }
    const response = await apiClient.get<UserResponse>(`/users/${userId}`, { signal });
    return mapUserResponse(response);
  }

  async listUsers(filters?: UsersListFilters, signal?: AbortSignal): Promise<AppUser[]> {
    if (isMockAuth()) {
      return [MOCK_USER];
    }

    const query: Record<string, string | boolean> = {};
    if (filters?.blockId) query.block_id = filters.blockId;
    if (filters?.role && filters.role !== "all") {
      query.role = toBackendRole(filters.role as UserRole);
    }
    if (filters?.locationId) query.location_id = filters.locationId;
    if (filters?.isActive !== undefined) query.is_active = filters.isActive;

    const response = await apiClient.get<UsersListDTO>("/admin/staff/users", { query, signal });
    return response.items.map(mapUserResponse);
  }

  async listManagedUsers(filters?: Omit<UsersListFilters, "role">, signal?: AbortSignal): Promise<AppUser[]> {
    if (isMockAuth()) {
      return [MOCK_USER];
    }

    const query: Record<string, string | boolean> = {};
    if (filters?.blockId) query.block_id = filters.blockId;
    if (filters?.locationId) query.location_id = filters.locationId;
    if (filters?.isActive !== undefined) query.is_active = filters.isActive;

    const response = await apiClient.get<UsersListDTO>("/personnel/managed-users", { query, signal });
    return response.items.map(mapUserResponse);
  }

  async uploadOwnAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ avatar_url: string }>("/users/me/avatar", formData);
    return { avatarUrl: response.avatar_url };
  }

  async getOwnCompensation(signal?: AbortSignal): Promise<EmployeeCompensation | null> {
    if (isMockAuth()) return null;
    const response = await apiClient.get<EmployeeCompensationDTO | null>("/users/me/compensation", {
      signal,
    });
    if (!response) return null;
    return mapCompensation(response);
  }

  async getOwnTimesheet(query: OwnTimesheetQuery, signal?: AbortSignal): Promise<OwnTimesheet> {
    if (isMockAuth()) {
      return {
        items: [],
        periodFrom: query.periodFrom,
        periodTo: query.periodTo,
        totalHours: "0",
      };
    }
    const response = await apiClient.get<OwnTimesheetDTO>("/users/me/timesheet", {
      query: {
        period_from: query.periodFrom,
        period_to: query.periodTo,
        location_id: query.locationId,
      },
      signal,
    });
    return {
      items: response.items.map((item) => ({
        id: item.id,
        workDate: item.work_date,
        activityCode: item.activity_code,
        activityName: item.activity_name,
        hours: item.hours,
        shiftType: item.shift_type as ShiftType,
        comment: item.comment ?? undefined,
      })),
      periodFrom: response.period_from,
      periodTo: response.period_to,
      totalHours: response.total_hours,
    };
  }
}

export const UserAPI = new UserAPIImpl();
