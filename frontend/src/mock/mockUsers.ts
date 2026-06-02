import { DEMO_LOGIN_ACCOUNTS } from "../config/demoAccounts";
import type { AppUser, UserRole } from "../types/user";
import { toFrontendRole, type BackendRole } from "../utils/roleMap";
import { getPresentationRole } from "./presentationRoleStorage";

const PROFILE_BY_EXTERNAL_ID: Record<string, Omit<AppUser, "id" | "role" | "externalSystemId">> = {
  superadmin_001: {
    name: "Ирина Козлова",
    firstName: "Ирина",
    lastName: "Козлова",
    position: "Суперадмин сети",
    blockName: "Вся сеть",
  },
  rootadmin_001: {
    name: "Алексей Смирнов",
    firstName: "Алексей",
    lastName: "Смирнов",
    position: "Администратор ПО",
  },
  staff_admin_001: {
    name: "Дмитрий Волков",
    firstName: "Дмитрий",
    lastName: "Волков",
    position: "Администратор кадров",
    blockName: "Центр",
  },
  education_admin_001: {
    name: "Елена Морозова",
    firstName: "Елена",
    lastName: "Морозова",
    position: "Администратор обучения",
  },
  sales_admin_001: {
    name: "Сергей Лебедев",
    firstName: "Сергей",
    lastName: "Лебедев",
    position: "Администратор продаж",
  },
  manager_north_001: {
    name: "Павел Орлов",
    firstName: "Павел",
    lastName: "Орлов",
    position: "Региональный менеджер",
    blockName: "Север",
    storeName: "ТЦ Метрополис",
  },
  seller_anna_001: {
    name: "Анна Иванова",
    firstName: "Анна",
    lastName: "Иванова",
    position: "Продавец",
    store: "ТЦ Метрополис",
    storeName: "ТЦ Метрополис",
    blockName: "Центр",
  },
};

function roleFromHint(hint?: string): UserRole {
  if (!hint) return "seller";
  return toFrontendRole(hint as BackendRole);
}

function buildUser(externalSystemId: string, roleHint?: string): AppUser {
  const role = roleFromHint(roleHint);
  const profile = PROFILE_BY_EXTERNAL_ID[externalSystemId] ?? {
    name: externalSystemId,
    firstName: externalSystemId,
    lastName: "",
  };
  return {
    id: `mock-${externalSystemId}`,
    externalSystemId,
    role,
    isActive: true,
    ...profile,
  };
}

const ALL_MOCK_USERS: AppUser[] = DEMO_LOGIN_ACCOUNTS.map((account) =>
  buildUser(account.externalSystemId, account.roleHint),
);

export function getMockUserByExternalId(externalSystemId: string): AppUser {
  const found = ALL_MOCK_USERS.find((u) => u.externalSystemId === externalSystemId);
  return found ?? buildUser(externalSystemId);
}

export function getMockUserByRole(role: UserRole): AppUser {
  const found = ALL_MOCK_USERS.find((u) => u.role === role);
  return found ?? buildUser("seller_anna_001", "seller");
}

export function getCurrentMockUser(): AppUser {
  const role = getPresentationRole();
  if (role) return getMockUserByRole(role);
  return getMockUserByExternalId("seller_anna_001");
}

export function listAllMockUsers(): AppUser[] {
  return [...ALL_MOCK_USERS];
}

export function listMockManagedUsers(): AppUser[] {
  return ALL_MOCK_USERS.filter((u) => u.role === "seller" || u.role === "manager");
}
