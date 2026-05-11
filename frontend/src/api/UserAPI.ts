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

class UserAPIImpl {
  async fetchMe(): Promise<AppUser> {
    if (isMockAuth()) {
      return MOCK_USER;
    }

    const response = await apiClient.get<MeResponse>("/users/me");

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
}

export const UserAPI = new UserAPIImpl();
