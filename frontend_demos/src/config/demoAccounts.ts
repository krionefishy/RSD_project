/** Demo login accounts — keep in sync with backend/scripts/demo_accounts.json */

export const DEMO_PASSWORD = "Password123!";

export interface DemoAccount {
  externalSystemId: string;
  label: string;
  roleHint?: string;
}

export const DEMO_LOGIN_ACCOUNTS: DemoAccount[] = [
  { externalSystemId: "superadmin_001", label: "Суперадмин", roleHint: "super_admin" },
  { externalSystemId: "rootadmin_001", label: "Админ ПО", roleHint: "root_admin" },
  { externalSystemId: "staff_admin_001", label: "Кадры", roleHint: "admin_staff" },
  { externalSystemId: "education_admin_001", label: "Обучение", roleHint: "admin_education" },
  { externalSystemId: "sales_admin_001", label: "Продажи", roleHint: "admin_sales" },
  { externalSystemId: "manager_north_001", label: "Менеджер", roleHint: "manager" },
  { externalSystemId: "seller_anna_001", label: "Продавец", roleHint: "seller" },
];

export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true";
}
