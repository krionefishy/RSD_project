// React import not needed in React 18+
import { Users, Database, FileText, Shield } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";
import { accounts } from "../../mock/mockData";

export default function AdminPODashboardPage() {
  const { user } = useApp();
  if (!user) return null;

  const stats = [
    { label: "Всего аккаунтов", value: accounts.length, icon: Users, color: "#2E7D32", bg: "#E8F5E9" },
    { label: "Активных", value: accounts.filter(a => a.status === "active").length, icon: Shield, color: "#22C55E", bg: "#F0FDF4" },
    { label: "Заблокированных", value: accounts.filter(a => a.status === "blocked").length, icon: Shield, color: "#EF4444", bg: "#FEF2F2" },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={44} />
          <div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Администратор ПО</p>
            <p style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>{user.name}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-3 text-center" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: s.bg }}>
                <s.icon size={18} color={s.color} />
              </div>
              <p style={{ color: "#1E293B", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: "#64748B", fontSize: 10 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Управление аккаунтами</p>
          <div className="flex flex-col gap-2">
            {accounts.map((acc, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: acc.status === "active" ? "#F0FDF4" : "#FEF2F2" }}>
                  <Users size={20} color={acc.status === "active" ? "#22C55E" : "#EF4444"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{acc.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11 }}>{acc.externalSystemId}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: acc.status === "active" ? "#F0FDF4" : "#FEF2F2", color: acc.status === "active" ? "#16A34A" : "#DC2626", fontSize: 10, fontWeight: 600 }}>
                  {acc.roleLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Системные функции</p>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-xl text-center" style={{ background: "#E8F5E9" }}>
              <Database size={24} color="#2E7D32" className="mx-auto mb-2" />
              <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>Резервное копирование</p>
            </button>
            <button className="p-4 rounded-xl text-center" style={{ background: "#F0FDF4" }}>
              <FileText size={24} color="#22C55E" className="mx-auto mb-2" />
              <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>Журнал событий</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
