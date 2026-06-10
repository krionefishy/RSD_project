import { Outlet } from "react-router";

/** Админ ПО: без нижней навигации — хаб модулей на главной странице. */
export default function AdminPOTemplate() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F8FAFC" }}>
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
