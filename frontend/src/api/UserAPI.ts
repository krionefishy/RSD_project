import { AppUser } from "../types/user";
import { toFrontendRole } from "../utils/roleMap";
import { apiClient } from "./APIClient";

interface MeResponse {
  id: string;
  external_system_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  phone?: string | null;
  name?: string | null;
}

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
};

function buildDisplayName(first?: string | null, last?: string | null, externalSystemId?: string | null): string {
  const parts = [first, last].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  return externalSystemId ?? "";
}

interface UserResponse {
  id: string;
  external_system_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  phone?: string | null;
  name?: string | null;
  avatar?: string | null;
  block_id?: string | null;
  location_id?: string | null;
  is_active?: boolean;
}

function mapUserResponse(response: UserResponse): AppUser {
  const role = toFrontendRole(response.role ?? "seller");
  const firstName = response.first_name ?? "";
  const lastName = response.last_name ?? "";
  const externalSystemId = response.external_system_id ?? "";

  return {
    id: response.id,
    name: response.name ?? buildDisplayName(firstName, lastName, externalSystemId),
    firstName: firstName || buildDisplayName(firstName, lastName, externalSystemId),
    lastName: lastName || undefined,
    role,
    externalSystemId,
    phone: response.phone ?? undefined,
    avatar: response.avatar ?? undefined,
    block: response.block_id ?? undefined,
    store: response.location_id ?? undefined,
  };
}

interface UsersListFilters {
  blockId?: string;
  role?: string;
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

    const response = await apiClient.get<MeResponse>("/users/me", { signal });

    const role = toFrontendRole(response.role ?? "seller");
    const firstName = response.first_name ?? "";
    const lastName = response.last_name ?? "";
    const externalSystemId = response.external_system_id ?? "";

    return {
      id: response.id,
      name: response.name ?? buildDisplayName(firstName, lastName, externalSystemId),
      firstName: firstName || buildDisplayName(firstName, lastName, externalSystemId),
      lastName: lastName || undefined,
      role,
      externalSystemId,
      phone: response.phone ?? undefined,
    };
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
    if (filters?.role) query.role = filters.role;
    if (filters?.locationId) query.location_id = filters.locationId;
    if (filters?.isActive !== undefined) query.is_active = filters.isActive;

    const response = await apiClient.get<UsersListDTO>("/users", { query, signal });
    return response.items.map(mapUserResponse);
  }
}

export const UserAPI = new UserAPIImpl();
