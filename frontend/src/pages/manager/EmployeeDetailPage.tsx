import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "../../components/Avatar";
import { ProgressCircle } from "../../components/ProgressCircle";
import { managerEmployees } from "../../mock/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function EmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"sales" | "learning" | "schedule">("sales");
  const emp = managerEmployees.find((e) => e.id === employeeId);
  if (!emp) return null;

  const salesColor = emp.salesPercent >= 100 ? "#22C55E" : emp.salesPercent >= 70 ? "#2E7D32" : "#F59E0B";
  const learningColor = emp.learningPercent >= 90 ? "#22C55E" : emp.learningPercent >= 70 ? "#2E7D32" : "#F59E0B";

  const salesChartData = [
    { day: "Пн", fact: 45000 },
    { day: "Вт", fact: 38000 },
    { day: "Ср", fact: 52000 },
    { day: "Чт", fact: 31000 },
    { day: "Пт", fact: 48000 },
    { day: "Сб", fact: 61000 },
    { day: "Вс", fact: 35100 },
  ];

  const shiftDays = ["12 апр", "13 апр", "14 апр", "16 апр", "17 апр", "19 апр"];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-5" style={{ background: "linear-gradient(160deg, #2E7D32 0%, #1B5E20 100%)" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 mb-4" style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
          <ChevronLeft size={18} color="rgba(255,255,255,0.8)" />
          Сотрудники
        </button>
        <div className="flex items-center gap-3">
          <Avatar name={emp.name} size={56} />
          <div>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{emp.name}</p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{emp.position}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{emp.store}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 py-3 gap-2 overflow-x-auto" style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", scrollbarWidth: "none" }}>
        {(["sales", "learning", "schedule"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-shrink-0 px-4 py-2 rounded-xl"
            style={{
              background: tab === t ? "#2E7D32" : "#F1F5F9",
              color: tab === t ? "#fff" : "#374151",
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === "sales" ? "Продажи" : t === "learning" ? "Обучение" : "Расписание"}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {tab === "sales" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl p-4 flex items-center gap-5" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <ProgressCircle value={emp.salesPercent} size={100} strokeWidth={10} color={salesColor}>
                <div className="text-center">
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#1E293B" }}>{emp.salesPercent}%</span>
                </div>
              </ProgressCircle>
              <div>
                <p style={{ color: "#64748B", fontSize: 12 }}>Выполнение плана</p>
                <p style={{ color: "#1E293B", fontSize: 18, fontWeight: 700 }}>35 100 ₽</p>
                <p style={{ color: "#64748B", fontSize: 12 }}>из 45 000 ₽ плана</p>
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Продажи за неделю</p>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={salesChartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString("ru")} ₽`, "Продажи"]} />
                  <Bar dataKey="fact" fill={salesColor} radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "learning" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl p-4 flex items-center gap-5" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <ProgressCircle value={emp.learningPercent} size={100} strokeWidth={10} color={learningColor}>
                <div className="text-center">
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#1E293B" }}>{emp.learningPercent}%</span>
                </div>
              </ProgressCircle>
              <div>
                <p style={{ color: "#64748B", fontSize: 12 }}>Прогресс обучения</p>
                <p style={{ color: "#1E293B", fontSize: 14, fontWeight: 600 }}>29 из 50 материалов</p>
                <p style={{ color: "#64748B", fontSize: 12 }}>2 теста не сданы</p>
              </div>
            </div>
            {["Организация работы", "Скрипты продаж", "Описание продуктов", "Технологические карты"].map((section, i) => {
              const pct = [75, 50, 30, 83][i];
              return (
                <div key={i} className="rounded-xl px-4 py-3" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>{section}</span>
                    <span style={{ color: pct >= 70 ? "#22C55E" : "#F59E0B", fontSize: 13, fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 70 ? "#22C55E" : "#F59E0B" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "schedule" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {shiftDays.map((day, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < shiftDays.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#E8F5E9" }}>
                    <span style={{ fontSize: 14 }}>💼</span>
                  </div>
                  <span style={{ color: "#374151", fontSize: 14 }}>{day}</span>
                </div>
                <span style={{ color: "#2E7D32", fontSize: 13, fontWeight: 500 }}>09:00–18:00</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
