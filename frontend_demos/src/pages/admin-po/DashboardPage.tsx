import { Users, Shield, LogOut, UserCog, BookOpen, DollarSign, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";
import { accounts } from "../../mock/mockData";
import { showDemoActionToast } from "../../utils/demoToast";
import { AdminPOInstructionsPanel } from "../../components/instructions/AdminPOInstructionsPanel";

const MODULES = [
  {
    title: "Аккаунты",
    description: "Создание и управление учётными записями всех ролей",
    icon: UserCog,
    path: null as string | null,
    color: "#2E7D32",
    bg: "#E8F5E9",
  },
  {
    title: "Персонал",
    description: "Профили, графики, структура точек и блоков",
    icon: Users,
    path: "/admin-po/preview/personnel",
    color: "#2E7D32",
    bg: "#F0FDF4",
  },
  {
    title: "Обучение",
    description: "База знаний, курсы, тесты и назначения",
    icon: BookOpen,
    path: "/admin-po/preview/edu",
    color: "#C41E3A",
    bg: "#FCE4EC",
  },
  {
    title: "Продажи",
    description: "Планы, факт продаж, мотивация и отчёты",
    icon: DollarSign,
    path: "/admin-po/preview/sales",
    color: "#2E7D32",
    bg: "#E8F5E9",
  },
];

export default function AdminPODashboardPage() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  if (!user) return null;

  const stats = [
    { label: "Всего аккаунтов", value: accounts.length, icon: Users, color: "#2E7D32", bg: "#E8F5E9" },
    {
      label: "Активных",
      value: accounts.filter((a) => a.status === "active").length,
      icon: Shield,
      color: "#22C55E",
      bg: "#F0FDF4",
    },
    {
      label: "Заблокированных",
      value: accounts.filter((a) => a.status === "blocked").length,
      icon: Shield,
      color: "#EF4444",
      bg: "#FEF2F2",
    },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={44} />
            <div>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Администратор ПО</p>
              <p style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>{user.name}</p>
            </div>
          </div>
          <button
            type="button"
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
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 12 }}>
          Операционный доступ ко всем модулям сети (см. матрицу ролей)
        </p>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-3 text-center"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ background: s.bg }}
              >
                <s.icon size={18} color={s.color} />
              </div>
              <p style={{ color: "#1E293B", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: "#64748B", fontSize: 10 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Модули системы</p>
          <div className="flex flex-col gap-2">
            {MODULES.map((mod) => (
              <button
                key={mod.title}
                type="button"
                onClick={() => {
                  if (mod.path) navigate(mod.path);
                  else showDemoActionToast("Управление аккаунтами — на этой странице");
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left"
                style={{ background: "#F8FAFC" }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: mod.bg }}
                >
                  <mod.icon size={22} color={mod.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>{mod.title}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>{mod.description}</p>
                </div>
                <ChevronRight size={18} color="#94A3B8" />
              </button>
            ))}
          </div>
        </div>

        <AdminPOInstructionsPanel />

        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Учётные записи</p>
          <div className="flex flex-col gap-2">
            {accounts.map((acc, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-3 rounded-xl"
                style={{ background: "#F8FAFC" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: acc.status === "active" ? "#F0FDF4" : "#FEF2F2" }}
                >
                  <Users size={20} color={acc.status === "active" ? "#22C55E" : "#EF4444"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500 }}>{acc.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11 }}>{acc.externalSystemId}</p>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: acc.status === "active" ? "#F0FDF4" : "#FEF2F2",
                    color: acc.status === "active" ? "#16A34A" : "#DC2626",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {acc.roleLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
