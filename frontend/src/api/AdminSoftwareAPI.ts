import { AppUser } from "../types/user";
import { toFrontendRole } from "../utils/roleMap";
import { apiClient } from "./APIClient";

export interface CreateUserData {
  externalSystemId: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  blockId?: string;
  locationId?: string;
}

export interface BlockAssignment {
  blockId: string;
  name: string;
  managerId?: string;
}

interface CreateUserDTO {
  external_system_id: string;
  password: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
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
  block_id?: string | null;
  location_id?: string | null;
}

interface BlockAssignmentDTO {
  block_id: string;
  name: string;
  manager_id?: string;
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
    block: response.block_id ?? undefined,
    store: response.location_id ?? undefined,
  };
}

function mapBlockAssignment(dto: BlockAssignmentDTO): BlockAssignment {
  return {
    blockId: dto.block_id,
    name: dto.name,
    managerId: dto.manager_id,
  };
}

class AdminSoftwareAPIImpl {
  async createUser(data: CreateUserData): Promise<AppUser> {
    const body: CreateUserDTO = {
      external_system_id: data.externalSystemId,
      password: data.password,
      role: data.role,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      block_id: data.blockId,
      location_id: data.locationId,
    };

    const response = await apiClient.post<UserResponse>("/admin/software/users", body);
    return mapUserResponse(response);
  }

  async blockUser(userId: string): Promise<void> {
    await apiClient.post(`/admin/software/users/${userId}/block`);
  }

  async unblockUser(userId: string): Promise<void> {
    await apiClient.post(`/admin/software/users/${userId}/unblock`);
  }

  async assignManagerBlock(managerId: string, blockId: string): Promise<BlockAssignment> {
    const response = await apiClient.post<BlockAssignmentDTO>(`/admin/software/managers/${managerId}/blocks`, { block_id: blockId });
    return mapBlockAssignment(response);
  }

  async assignUserBlock(userId: string, blockId: string): Promise<BlockAssignment> {
    const response = await apiClient.post<BlockAssignmentDTO>(`/admin/software/users/${userId}/blocks`, { block_id: blockId });
    return mapBlockAssignment(response);
  }

  async removeUserBlock(userId: string): Promise<void> {
    await apiClient.delete(`/admin/software/users/${userId}/blocks`);
  }
}

export const AdminSoftwareAPI = new AdminSoftwareAPIImpl();
