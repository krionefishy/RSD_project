// React import not needed in React 18+
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";

export default function AdminPersonnelDashboardPage() {
  const { user } = useApp();
  if (!user) return null;

  const stats = [
    { label: "Всего сотрудников", value: 142, icon: Users, color: "#2E7D32", bg: "#E8F5E9" },
    { label: "На смене", value: 98, icon: UserCheck, color: "#22C55E", bg: "#F0FDF4" },
    { label: "В отпуске", value: 12, icon: Clock, color: "#F5A623", bg: "#ECFEFF" },
    { label: "На больничном", value: 4, icon: UserX, color: "#F59E0B", bg: "#FFFBEB" },
  ];

  const recentActivities = [
    { action: "Новый сотрудник", name: "Алексей Петров", date: "14.04.2026", type: "add" },
    { action: "Отпуск согласован", name: "Мария Сидорова", date: "13.04.2026", type: "vacation" },
    { action: "Увольнение", name: "Иван Кузнецов", date: "12.04.2026", type: "remove" },
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
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <s.icon size={20} color={s.color} />
              </div>
              <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Последние действия</p>
          <div className="flex flex-col gap-3">
            {recentActivities.map((act, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: act.type === "add" ? "#F0FDF4" : act.type === "remove" ? "#FEF2F2" : "#ECFEFF" }}>
                  <span style={{ fontSize: 14 }}>{act.type === "add" ? "✅" : act.type === "remove" ? "❌" : "🌴"}</span>
                </div>
                <div>
                  <p style={{ color: "#64748B", fontSize: 12 }}>{act.action}</p>
                  <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{act.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11 }}>{act.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
