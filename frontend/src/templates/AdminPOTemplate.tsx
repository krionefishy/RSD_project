import { Outlet } from "react-router";
import { Demo1DesignBadge } from "../components/Demo1DesignBadge";

/** Админ ПО: без нижней навигации — хаб модулей на главной странице. */
export default function AdminPOTemplate() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F8FAFC" }}>
      <div className="flex-1 overflow-auto">
        <div className="px-4 pt-2">
          <Demo1DesignBadge />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
