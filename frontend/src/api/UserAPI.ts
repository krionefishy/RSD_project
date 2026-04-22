import { AppUser } from "../types/user";
import { toFrontendRole } from "../utils/roleMap";
import { apiClient } from "./APIClient";

interface MeResponse {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  phone?: string | null;
  name?: string | null;
}

function buildDisplayName(first?: string | null, last?: string | null, email?: string | null): string {
  const parts = [first, last].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  return email ?? "";
}

class UserAPIImpl {
  async fetchMe(): Promise<AppUser> {
    const response = await apiClient.get<MeResponse>("/users/me");

    const role = toFrontendRole(response.role ?? "seller");
    const firstName = response.first_name ?? "";
    const lastName = response.last_name ?? "";
    const email = response.email ?? "";

    return {
      id: response.id,
      name: response.name ?? buildDisplayName(firstName, lastName, email),
      firstName: firstName || buildDisplayName(firstName, lastName, email),
      lastName: lastName || undefined,
      role,
      email,
      phone: response.phone ?? undefined,
    };
  }
}

export const UserAPI = new UserAPIImpl();
