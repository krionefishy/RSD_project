import type {
  BlockMemberStatus,
  CreateEmployeeProfileData,
  CreateEmployeeProfileResult,
  EmployeeCompensation,
  OwnTimesheetQuery,
  TimesheetEntry,
  TimesheetUploadResult,
  UpdateEmployeeProfileData,
  UpdateTimeEntryData,
  UpsertEmployeeCompensationData,
  UserProfile,
} from "../types/profile";
import { useMockAuth } from "../config/presentationMode";
import { getMockUserByExternalId } from "../mock/mockUsers";
import { mockTimeEntry } from "../mock/fixtures/personnel";
import { toFrontendRole } from "../utils/roleMap";
import { apiClient } from "./APIClient";

export interface ResetPasswordResult {
  temporaryPassword: string;
}

interface LocationBriefDTO {
  id: number;
  name: string;
}

interface BlockBriefDTO {
  id: number;
  name: string;
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

interface CreateEmployeeProfileResultDTO {
  user: UserProfileDTO;
  temp_password: string;
}

interface EmployeeCompensationDTO {
  user_id: string;
  base_salary: string;
  hourly_rate: string;
  night_hourly_rate?: string | null;
  effective_night_hourly_rate: string;
  updated_at: string;
}

interface ResetPasswordDTO {
  temp_password: string;
}

interface EmployeeTimeEntryDTO {
  id: number;
  user_id: string;
  work_date: string;
  activity_code: string;
  activity_name: string;
  hours: string;
  shift_type: string;
  comment?: string | null;
}

interface TimesheetImportErrorDTO {
  row?: number | null;
  column?: string | null;
  message: string;
}

interface TimesheetUploadResultDTO {
  upload_id: number;
  status: string;
  rows_count: number;
  errors: TimesheetImportErrorDTO[];
}

function mapProfile(dto: UserProfileDTO): UserProfile {
  const firstName = dto.first_name ?? "";
  const lastName = dto.last_name ?? "";
  const status = dto.block_member_status?.toLowerCase();

  return {
    id: dto.id,
    externalSystemId: dto.external_system_id,
    role: toFrontendRole(dto.role),
    firstName: firstName || undefined,
    middleName: dto.middle_name ?? undefined,
    lastName: lastName || undefined,
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

function mapCreateBody(data: CreateEmployeeProfileData) {
  return {
    external_system_id: data.externalSystemId,
    first_name: data.firstName,
    middle_name: data.middleName,
    last_name: data.lastName,
    phone: data.phone,
    birth_date: data.birthDate,
    position: data.position,
    location_id: data.locationId,
    block_id: data.blockId,
    block_member_status: data.blockMemberStatus,
  };
}

function mapUpdateBody(data: UpdateEmployeeProfileData) {
  return {
    first_name: data.firstName,
    middle_name: data.middleName,
    last_name: data.lastName,
    phone: data.phone,
    birth_date: data.birthDate,
    position: data.position,
    location_id: data.locationId,
    block_id: data.blockId,
    block_member_status: data.blockMemberStatus,
  };
}

class AdminStaffAPIImpl {
  async createEmployeeProfile(data: CreateEmployeeProfileData): Promise<CreateEmployeeProfileResult> {
    if (useMockAuth()) {
      const user = getMockUserByExternalId(data.externalSystemId);
      return {
        user: {
          id: user.id,
          externalSystemId: data.externalSystemId,
          role: user.role,
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: true,
          isTempPassword: true,
        },
        temporaryPassword: "Password123!",
      };
    }
    const response = await apiClient.post<CreateEmployeeProfileResultDTO>(
      "/admin/staff/employees",
      mapCreateBody(data),
    );
    return {
      user: mapProfile(response.user),
      temporaryPassword: response.temp_password,
    };
  }

  async updateEmployeeProfile(userId: string, data: UpdateEmployeeProfileData): Promise<UserProfile> {
    if (useMockAuth()) {
      return {
        id: userId,
        externalSystemId: "mock_001",
        role: "seller",
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: true,
        isTempPassword: false,
      };
    }
    const response = await apiClient.patch<UserProfileDTO>(
      `/admin/staff/users/${userId}/employee-profile`,
      mapUpdateBody(data),
    );
    return mapProfile(response);
  }

  async deleteEmployeeProfile(_userId: string): Promise<void> {
    if (useMockAuth()) return;
    await apiClient.delete(`/admin/staff/users/${_userId}/employee-profile`);
  }

  async blockEmployeeProfile(userId: string, reason?: string): Promise<UserProfile> {
    if (useMockAuth()) {
      return {
        id: userId,
        externalSystemId: "mock_001",
        role: "seller",
        firstName: "Анна",
        lastName: "Иванова",
        isActive: false,
        isTempPassword: false,
      };
    }
    const response = await apiClient.post<UserProfileDTO>(
      `/admin/staff/users/${userId}/block-profile`,
      undefined,
      { query: reason ? { reason } : undefined },
    );
    return mapProfile(response);
  }

  async unblockEmployeeProfile(userId: string): Promise<UserProfile> {
    if (useMockAuth()) {
      return {
        id: userId,
        externalSystemId: "mock_001",
        role: "seller",
        firstName: "Анна",
        lastName: "Иванова",
        isActive: true,
        isTempPassword: false,
      };
    }
    const response = await apiClient.post<UserProfileDTO>(
      `/admin/staff/users/${userId}/unblock-profile`,
    );
    return mapProfile(response);
  }

  async resetPassword(userId: string): Promise<ResetPasswordResult> {
    if (useMockAuth()) {
      return { temporaryPassword: "Password123!" };
    }
    const response = await apiClient.post<ResetPasswordDTO>(
      `/admin/staff/users/${userId}/reset-password`,
    );
    return { temporaryPassword: response.temp_password };
  }

  async uploadEmployeeAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
    if (useMockAuth()) {
      return { avatarUrl: URL.createObjectURL(file) };
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<{ avatar_url: string }>(
      `/admin/staff/users/${userId}/avatar`,
      formData,
    );
    return { avatarUrl: response.avatar_url };
  }

  async changeBlockMemberStatus(
    userId: string,
    data: { blockId: number; status: BlockMemberStatus },
  ): Promise<UserProfile> {
    if (useMockAuth()) {
      return {
        id: userId,
        externalSystemId: "mock_001",
        role: "seller",
        firstName: "Анна",
        isActive: true,
        isTempPassword: false,
        block: { id: data.blockId, name: "Центр" },
        blockMemberStatus: data.status,
      };
    }
    const response = await apiClient.patch<UserProfileDTO>(
      `/admin/staff/users/${userId}/block-member-status`,
      { block_id: data.blockId, status: data.status },
    );
    return mapProfile(response);
  }

  async upsertEmployeeCompensation(
    userId: string,
    data: UpsertEmployeeCompensationData,
  ): Promise<EmployeeCompensation> {
    if (useMockAuth()) {
      return {
        userId,
        baseSalary: data.baseSalary,
        hourlyRate: data.hourlyRate,
        nightHourlyRate: data.nightHourlyRate,
        effectiveNightHourlyRate: data.nightHourlyRate ?? data.hourlyRate,
        updatedAt: new Date().toISOString(),
      };
    }
    const response = await apiClient.put<EmployeeCompensationDTO>(
      `/admin/staff/users/${userId}/compensation`,
      {
        base_salary: data.baseSalary,
        hourly_rate: data.hourlyRate,
        night_hourly_rate: data.nightHourlyRate,
      },
    );
    return mapCompensation(response);
  }

  async uploadTimesheetFile(
    _file: File,
    _query: OwnTimesheetQuery,
    _locationId?: number,
  ): Promise<TimesheetUploadResult> {
    if (useMockAuth()) {
      return { uploadId: 1, status: "processed", rowsCount: 142, errors: [] };
    }
    const formData = new FormData();
    formData.append("file", _file);
    const response = await apiClient.post<TimesheetUploadResultDTO>(
      "/admin/staff/timesheets/upload",
      formData,
      {
        query: {
          period_from: _query.periodFrom,
          period_to: _query.periodTo,
          location_id: _locationId,
        },
      },
    );
    return {
      uploadId: response.upload_id,
      status: response.status,
      rowsCount: response.rows_count,
      errors: response.errors.map((error) => ({
        row: error.row,
        column: error.column,
        message: error.message,
      })),
    };
  }

  async updateTimeEntry(entryId: number, data: UpdateTimeEntryData): Promise<TimesheetEntry> {
    if (useMockAuth()) {
      const entry = mockTimeEntry(entryId);
      return {
        ...entry,
        hours: data.hours ?? entry.hours,
        activityCode: data.activityCode ?? entry.activityCode,
      };
    }
    const response = await apiClient.patch<EmployeeTimeEntryDTO>(
      `/admin/staff/timesheets/entries/${entryId}`,
      {
        activity_code: data.activityCode,
        hours: data.hours,
        shift_type: data.shiftType,
        comment: data.comment,
      },
    );
    return {
      id: response.id,
      workDate: response.work_date,
      activityCode: response.activity_code,
      activityName: response.activity_name,
      hours: response.hours,
      shiftType: response.shift_type as TimesheetEntry["shiftType"],
      comment: response.comment ?? undefined,
    };
  }

  async deleteTimeEntry(_entryId: number): Promise<void> {
    if (useMockAuth()) return;
    await apiClient.delete(`/admin/staff/timesheets/entries/${_entryId}`);
  }
}

export const AdminStaffAPI = new AdminStaffAPIImpl();
