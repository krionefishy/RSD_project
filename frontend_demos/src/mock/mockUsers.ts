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
    name: "Ирина Волкова",
    firstName: "Ирина",
    lastName: "Волкова",
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
    name: "Иван Иванов",
    firstName: "Иван",
    lastName: "Иванов",
    position: "Региональный менеджер",
    block: "1",
    blockName: "Север",
    storeName: "Точка 1",
  },
  seller_anna_001: {
    name: "Анна Смирнова",
    firstName: "Анна",
    lastName: "Смирнова",
    position: "Продавец",
    store: "Точка 1",
    storeName: "Точка 1",
    block: "1",
    blockName: "Север",
  },
  seller_maria_001: {
    name: "Мария Петрова",
    firstName: "Мария",
    lastName: "Петрова",
    position: "Продавец",
    store: "Точка 1",
    storeName: "Точка 1",
    block: "1",
    blockName: "Север",
  },
  seller_ivan_001: {
    name: "Иван Козлов",
    firstName: "Иван",
    lastName: "Козлов",
    position: "Продавец",
    store: "Точка 2",
    storeName: "Точка 2",
    block: "1",
    blockName: "Север",
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

const EXTRA_DEMO_SELLER_IDS = ["seller_maria_001", "seller_ivan_001"];

export function listMockManagedUsers(blockId?: string): AppUser[] {
  const extraSellers = EXTRA_DEMO_SELLER_IDS.map((id) => getMockUserByExternalId(id));
  const sellers = [
    ...ALL_MOCK_USERS.filter((u) => u.role === "seller"),
    ...extraSellers.filter((u) => !ALL_MOCK_USERS.some((m) => m.externalSystemId === u.externalSystemId)),
  ];
  if (blockId) {
    return sellers.filter((u) => u.block === blockId);
  }
  return sellers;
}
