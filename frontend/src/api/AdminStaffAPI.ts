import { apiClient } from "./APIClient";

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
}

export interface ResetPasswordResult {
  temporaryPassword: string;
}

export interface LocationAssignment {
  locationId: string;
  name: string;
}

interface UpdateUserDTO {
  first_name?: string;
  last_name?: string;
  phone?: string;
  position?: string;
}

interface ResetPasswordDTO {
  temporary_password: string;
}

interface LocationAssignmentDTO {
  location_id: string;
  name: string;
}

function mapResetPassword(dto: ResetPasswordDTO): ResetPasswordResult {
  return {
    temporaryPassword: dto.temporary_password,
  };
}

function mapLocationAssignment(dto: LocationAssignmentDTO): LocationAssignment {
  return {
    locationId: dto.location_id,
    name: dto.name,
  };
}

class AdminStaffAPIImpl {
  async updateUser(userId: string, data: UpdateUserData): Promise<void> {
    const body: UpdateUserDTO = {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      position: data.position,
    };
    await apiClient.patch(`/admin/staff/users/${userId}`, body);
  }

  async resetPassword(userId: string): Promise<ResetPasswordResult> {
    const response = await apiClient.post<ResetPasswordDTO>(`/admin/staff/users/${userId}/reset-password`);
    return mapResetPassword(response);
  }

  async uploadAvatar(userId: string, file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<{ avatar_url: string }>(`/admin/staff/users/${userId}/upload-avatar`, formData);
    return { avatarUrl: response.avatar_url };
  }

  async assignLocation(userId: string, locationId: string): Promise<LocationAssignment> {
    const response = await apiClient.post<LocationAssignmentDTO>(`/admin/staff/users/${userId}/locations`, { location_id: locationId });
    return mapLocationAssignment(response);
  }

  async removeLocation(userId: string, locationId: string): Promise<void> {
    await apiClient.delete(`/admin/staff/users/${userId}/locations`, { query: { location_id: locationId } });
  }
}

export const AdminStaffAPI = new AdminStaffAPIImpl();
