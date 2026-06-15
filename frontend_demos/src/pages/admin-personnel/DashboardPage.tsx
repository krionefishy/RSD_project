import { useEffect, useState } from "react";
import { Building2, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";
import { AdminStaffAPI } from "../../api/AdminStaffAPI";
import { getErrorMessage, isAbortError } from "../../utils/errors";

export default function AdminPersonnelDashboardPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    employeesCount: 0,
    locationsCount: 0,
    blocksCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    AdminStaffAPI.getOverview(controller.signal)
      .then(setStats)
      .catch((error) => {
        if (isAbortError(error)) return;
        console.error(getErrorMessage(error, "Не удалось загрузить сводку"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (!user) return null;

  const cards = [
    {
      label: "Всего сотрудников",
      value: loading ? "…" : stats.employeesCount,
      icon: Users,
      color: "#2E7D32",
      bg: "#E8F5E9",
      path: "/admin-personnel/manage",
    },
    {
      label: "Всего точек",
      value: loading ? "…" : stats.locationsCount,
      icon: MapPin,
      color: "#22C55E",
      bg: "#F0FDF4",
      path: "/admin-personnel/locations",
    },
    {
      label: "Всего блоков",
      value: loading ? "…" : stats.blocksCount,
      icon: Building2,
      color: "#F59E0B",
      bg: "#FFFBEB",
      path: "/admin-personnel/blocks",
    },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={44} />
          <div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Администратор персонала</p>
            <p style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>{user.name}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3">
          {cards.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => navigate(s.path)}
              className="rounded-2xl p-4 text-left w-full"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", cursor: "pointer" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <s.icon size={20} color={s.color} />
              </div>
              <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{s.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
