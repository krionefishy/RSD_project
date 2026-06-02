import { Globe, Building2, Users, Crown, BarChart3, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";

export default function SuperAdminDashboardPage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  if (!user) return null;

  const globalStats = [
    { label: "Точек по сети", value: 47, icon: Building2, color: "#2E7D32", bg: "#E8F5E9" },
    { label: "Активных пользователей", value: 142, icon: Users, color: "#22C55E", bg: "#F0FDF4" },
    { label: "Блоков (кустов)", value: 5, icon: Globe, color: "#C41E3A", bg: "#FCE4EC" },
    { label: "Администраторов ПО", value: 3, icon: Shield, color: "#F5A623", bg: "#ECFEFF" },
  ];

  const blocks = [
    { name: "Центр", stores: 12, employees: 38, sales: "4.2M ₽" },
    { name: "Юг", stores: 11, employees: 35, sales: "3.8M ₽" },
    { name: "Север", stores: 10, employees: 32, sales: "2.9M ₽" },
    { name: "Запад", stores: 8, employees: 22, sales: "1.5M ₽" },
    { name: "Восток", stores: 6, employees: 15, sales: "0.9M ₽" },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #C41E3A 0%, #A3152E 100%)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={44} />
            <div>
              <div className="flex items-center gap-1">
                <Crown size={14} color="#FFD700" />
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>СуперАдмин</p>
              </div>
              <p style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>{user.name}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.16)" }}
            aria-label="Выйти из аккаунта"
          >
            <LogOut size={18} color="#fff" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {globalStats.map((s, i) => (
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
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B" }}>Блоки (кусты)</h3>
            <BarChart3 size={18} color="#C41E3A" />
          </div>
          <div className="flex flex-col gap-3">
            {blocks.map((block, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#FCE4EC" }}>
                  <span style={{ color: "#C41E3A", fontSize: 14, fontWeight: 700 }}>{block.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>{block.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11 }}>{block.stores} точек · {block.employees} сотрудников</p>
                </div>
                <span style={{ color: "#C41E3A", fontSize: 14, fontWeight: 700 }}>{block.sales}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1E293B", marginBottom: 12 }}>Быстрые действия</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 rounded-xl text-center" style={{ background: "#E8F5E9" }}>
              <Shield size={24} color="#2E7D32" className="mx-auto mb-2" />
              <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>Создать админа ПО</p>
            </button>
            <button className="p-4 rounded-xl text-center" style={{ background: "#F0FDF4" }}>
              <Users size={24} color="#22C55E" className="mx-auto mb-2" />
              <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>Управление ролями</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
