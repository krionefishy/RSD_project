import { AppUser, UserRole } from "../types/user";
import { toFrontendRole } from "../utils/roleMap";
import { apiClient } from "./APIClient";

interface UserResponse {
  id: string;
  external_system_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  role?: string | null;
  phone?: string | null;
  name?: string | null;
  is_active?: boolean;
  avatar_url?: string | null;
}

interface UsersListResponse {
  items: UserResponse[];
  total: number;
}

function mapUser(r: UserResponse): AppUser {
  const firstName = r.first_name ?? "";
  const lastName = r.last_name ?? "";
  const externalSystemId = r.external_system_id ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return {
    id: r.id,
    name: fullName || externalSystemId,
    firstName: firstName || externalSystemId,
    lastName: lastName || undefined,
    role: toFrontendRole(r.role ?? "seller"),
    externalSystemId,
    phone: r.phone ?? undefined,
    avatar: r.avatar_url ?? undefined,
    isActive: r.is_active,
  };
}

class SuperAdminAPIImpl {
  async listAllUsers(params?: { role?: string; isActive?: boolean }): Promise<AppUser[]> {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.isActive !== undefined) query.set("is_active", String(params.isActive));
    const qs = query.toString();
    const response = await apiClient.get<UsersListResponse>(
      `/admin/super/users${qs ? `?${qs}` : ""}`,
    );
    return response.items.map(mapUser);
  }

  async assignRootAdmin(userId: string): Promise<AppUser> {
    const response = await apiClient.request<UserResponse>(
      `/admin/super/users/${userId}/root-admin`,
      { method: "POST" },
    );
    return mapUser(response);
  }

  async removeRootAdmin(userId: string): Promise<AppUser> {
    const response = await apiClient.request<UserResponse>(
      `/admin/super/users/${userId}/root-admin`,
      { method: "DELETE" },
    );
    return mapUser(response);
  }
}

export const SuperAdminAPI = new SuperAdminAPIImpl();
export type { UserRole };
