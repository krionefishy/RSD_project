import { AppUser } from "../types/user";
import { useMockApiModule } from "../config/presentationMode";
import { getMockUserByExternalId } from "../mock/mockUsers";
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

function mockCreateUser(data: CreateUserData): CreateUserResult {
  const user = getMockUserByExternalId(data.externalSystemId);
  return {
    user: {
      ...user,
      firstName: data.firstName ?? user.firstName,
      lastName: data.lastName ?? user.lastName,
      phone: data.phone ?? user.phone,
      role: toFrontendRole(data.role),
      block: data.blockId ?? user.block,
      store: data.locationId ?? user.store,
    },
    tempPassword: data.password,
  };
}

function mockBlockAssignment(blockId: string): BlockAssignment {
  return {
    blockId,
    assignedAt: new Date().toISOString(),
  };
}

class AdminSoftwareAPIImpl {
  async createUser(data: CreateUserData): Promise<CreateUserResult> {
    if (useMockApiModule("adminSoftware")) {
      return mockCreateUser(data);
    }

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

    const response = await apiClient.post<UserCreateResultDTO>("/admin/software/users", body);
    return mapCreateUserResult(response);
  }

  async blockUser(userId: string): Promise<void> {
    if (useMockApiModule("adminSoftware")) return;
    await apiClient.request(`/admin/software/users/${userId}/block`, { method: "PATCH" });
  }

  async unblockUser(userId: string): Promise<void> {
    if (useMockApiModule("adminSoftware")) return;
    await apiClient.request(`/admin/software/users/${userId}/unblock`, { method: "PATCH" });
  }

  async assignManagerBlock(managerId: string, blockId: string): Promise<BlockAssignment> {
    if (useMockApiModule("adminSoftware")) {
      return mockBlockAssignment(blockId);
    }
    const response = await apiClient.post<BlockAssignmentDTO>(`/admin/software/users/${managerId}/blocks`, {
      block_id: Number(blockId),
    });
    return mapBlockAssignment(response);
  }

  async assignUserBlock(userId: string, blockId: string): Promise<BlockAssignment> {
    if (useMockApiModule("adminSoftware")) {
      return mockBlockAssignment(blockId);
    }
    const response = await apiClient.post<BlockAssignmentDTO>(`/admin/software/users/${userId}/block`, {
      block_id: Number(blockId),
    });
    return mapBlockAssignment(response);
  }

  async removeUserBlock(userId: string): Promise<void> {
    if (useMockApiModule("adminSoftware")) return;
    await apiClient.delete(`/admin/software/users/${userId}/block`);
  }
}

export const AdminSoftwareAPI = new AdminSoftwareAPIImpl();
