// React import not needed in React 18+
import { BookOpen, LogOut, TestTube2, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";

export default function AdminEduDashboardPage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  if (!user) return null;

  const counters = [
    { label: "Курсов в системе", value: 6, icon: BookOpen, color: "#C41E3A", bg: "#FCE4EC" },
    { label: "Активных тестов", value: 5, icon: TestTube2, color: "#2E7D32", bg: "#E8F5E9" },
    { label: "Назначено курсов", value: 148, icon: Users, color: "#059669", bg: "#ECFDF5" },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={44} bgColor="#1B5E20" />
            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Администратор обучения</p>
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
        {/* Counters */}
        <div className="grid grid-cols-2 gap-3">
          {counters.map((c, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg }}>
                <c.icon size={20} color={c.color} />
              </div>
              <p style={{ color: "#1E293B", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{c.value}</p>
              <p style={{ color: "#64748B", fontSize: 12, marginTop: 3 }}>{c.label}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
