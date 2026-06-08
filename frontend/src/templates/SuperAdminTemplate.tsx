import { Outlet, useNavigate, useLocation } from "react-router";
import { LayoutDashboard, Building, User } from "lucide-react";
import { Demo1DesignBadge } from "../components/Demo1DesignBadge";

const TABS = [
  { path: "/superadmin", label: "Обзор", Icon: LayoutDashboard, exact: true },
  { path: "/superadmin/structure", label: "Структура", Icon: Building },
  { path: "/superadmin/profile", label: "Профиль", Icon: User },
];

export default function SuperAdminTemplate() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (tab: typeof TABS[0]) => {
    if (tab.exact) return location.pathname === tab.path;
    return location.pathname.startsWith(tab.path);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F8FAFC" }}>
      <div className="flex-1 overflow-auto" style={{ paddingBottom: 64 }}>
        <div className="px-4 pt-2">
          <Demo1DesignBadge />
        </div>
        <Outlet />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto"
        style={{
          background: "#fff",
          borderTop: "1px solid #E2E8F0",
          height: 64,
          display: "flex",
          zIndex: 100,
        }}
      >
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5"
            >
              <tab.Icon
                size={22}
                color={active ? "#2E7D32" : "#94A3B8"}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#2E7D32" : "#94A3B8",
                  lineHeight: 1.2,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
