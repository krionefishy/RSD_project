import { AppUser, UserRole } from "../types/user";
import { toFrontendRole, toBackendRole } from "../utils/roleMap";
import { apiClient } from "./APIClient";

export interface CreateUserData {
  externalSystemId: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  blockId?: string;
  locationId?: string;
}

export interface BlockAssignment {
  blockId: string;
  assignedAt: string;
}

export interface CreateUserResult {
  user: AppUser;
  tempPassword: string;
}

interface CreateUserDTO {
  external_system_id: string;
  password: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  position?: string;
  block_id?: string;
  location_id?: string;
}

interface UserResponse {
  id: string;
  external_system_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  phone?: string | null;
  name?: string | null;
  is_active?: boolean;
  avatar_url?: string | null;
  managed_block?: { id: number; name: string } | null;
  location?: { id: number; name: string } | null;
}

interface UsersListResponse {
  items: UserResponse[];
  total: number;
}

interface BlockAssignmentDTO {
  block_id: number;
  assigned_at: string;
}

interface UserCreateResultDTO {
  user: UserResponse;
  temp_password: string;
}

function mapUserResponse(response: UserResponse): AppUser {
  const firstName = response.first_name ?? "";
  const lastName = response.last_name ?? "";
  const externalSystemId = response.external_system_id ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    id: response.id,
    name: fullName || externalSystemId,
    firstName: firstName || externalSystemId,
    lastName: lastName || undefined,
    role: toFrontendRole(response.role ?? "seller"),
    externalSystemId,
    phone: response.phone ?? undefined,
    avatar: response.avatar_url ?? undefined,
    block: response.managed_block?.id ? String(response.managed_block.id) : undefined,
    store: response.location?.id ? String(response.location.id) : undefined,
  };
}

function mapBlockAssignment(dto: BlockAssignmentDTO): BlockAssignment {
  return {
    blockId: String(dto.block_id),
    assignedAt: dto.assigned_at,
  };
}

function mapCreateUserResult(dto: UserCreateResultDTO): CreateUserResult {
  return {
    user: mapUserResponse(dto.user),
    tempPassword: dto.temp_password,
  };
}

class AdminSoftwareAPIImpl {
  async createUser(data: CreateUserData): Promise<CreateUserResult> {
    const body: CreateUserDTO = {
      external_system_id: data.externalSystemId,
      password: data.password,
      role: data.role,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      position: data.position,
      block_id: data.blockId,
      location_id: data.locationId,
    };

    const response = await apiClient.post<UserCreateResultDTO>("/admin/software/users", body);
    return mapCreateUserResult(response);
  }

  async blockUser(userId: string): Promise<void> {
    await apiClient.request(`/admin/software/users/${userId}/block`, { method: "PATCH" });
  }

  async unblockUser(userId: string): Promise<void> {
    await apiClient.request(`/admin/software/users/${userId}/unblock`, { method: "PATCH" });
  }

  async assignManagerBlock(managerId: string, blockId: string): Promise<BlockAssignment> {
    const response = await apiClient.post<BlockAssignmentDTO>(`/admin/software/users/${managerId}/blocks`, { block_id: Number(blockId) });
    return mapBlockAssignment(response);
  }

  async assignUserBlock(userId: string, blockId: string): Promise<BlockAssignment> {
    const response = await apiClient.post<BlockAssignmentDTO>(`/admin/software/users/${userId}/block`, { block_id: Number(blockId) });
    return mapBlockAssignment(response);
  }

  async removeUserBlock(userId: string): Promise<void> {
    await apiClient.delete(`/admin/software/users/${userId}/block`);
  }

  async listUsers(params?: { role?: string; isActive?: boolean }): Promise<AppUser[]> {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.isActive !== undefined) query.set("is_active", String(params.isActive));
    const qs = query.toString();
    const response = await apiClient.get<UsersListResponse>(`/admin/software/users${qs ? `?${qs}` : ""}`);
    return response.items.map(mapUserResponse);
  }

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/admin/software/users/${userId}`);
  }

  async changeUserRole(userId: string, newRole: UserRole): Promise<AppUser> {
    const response = await apiClient.request<UserResponse>(`/admin/software/users/${userId}/role`, {
      method: "PATCH",
      body: { role: toBackendRole(newRole) },
    });
    return mapUserResponse(response);
  }
}

export const AdminSoftwareAPI = new AdminSoftwareAPIImpl();
