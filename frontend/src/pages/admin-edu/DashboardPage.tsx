// React import not needed in React 18+
import { BookOpen, TestTube2, Users, AlertTriangle, Clock } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar } from "../../components/Avatar";

const activityLog = [
  { action: "Опубликован курс", name: "«Ассортимент и продукция»", time: "Сегодня, 11:30", color: "#22C55E" },
  { action: "Назначен курс", name: "«Стандарты обслуживания» 12 продавцам", time: "Сегодня, 10:15", color: "#2E7D32" },
  { action: "Создан тест", name: "«Итоговый тест: Базовый курс»", time: "Вчера, 16:45", color: "#C41E3A" },
  { action: "Обновлён материал", name: "«Работа с кассовым аппаратом»", time: "Вчера, 14:20", color: "#F5A623" },
];

export default function AdminEduDashboardPage() {
  const { user } = useApp();
  if (!user) return null;

  const counters = [
    { label: "Курсов в системе", value: 6, icon: BookOpen, color: "#C41E3A", bg: "#FCE4EC" },
    { label: "Активных тестов", value: 5, icon: TestTube2, color: "#2E7D32", bg: "#E8F5E9" },
    { label: "Назначено курсов", value: 148, icon: Users, color: "#059669", bg: "#ECFDF5" },
    { label: "Просроченных тестов", value: 4, icon: AlertTriangle, color: "#DC2626", bg: "#FEF2F2" },
  ];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-5" style={{ background: "linear-gradient(160deg, #C41E3A 0%, #A3152E 100%)" }}>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={44} bgColor="#A3152E" />
          <div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Администратор обучения</p>
            <p style={{ color: "#fff", fontSize: 17, fontWeight: 600 }}>{user.name}</p>
          </div>
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

        {/* Activity log */}
        <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Последние действия</p>
          <div className="flex flex-col gap-3">
            {activityLog.map((log, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: log.color + "15" }}>
                  <Clock size={14} color={log.color} />
                </div>
                <div>
                  <p style={{ color: "#64748B", fontSize: 12 }}>{log.action}</p>
                  <p style={{ color: "#1E293B", fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{log.name}</p>
                  <p style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
